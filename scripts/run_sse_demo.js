const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

const PORT = process.env.SSE_PORT || 3001;
const clientsBySession = new Map();

// Try to load acceptEditsHelper if present for audit
let helper = null;
try {
  helper = require('../duomotai/src/modules/acceptEditsHelper');
  console.log('[sse_demo] acceptEditsHelper loaded');
} catch (e) {
  console.log('[sse_demo] acceptEditsHelper not found or failed to load; continuing without audit helper');
}

function broadcast(sessionId, eventType, data) {
  const clients = clientsBySession.get(sessionId) || [];
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  for (const res of clients) {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${payload}\n\n`);
  }
  // append audit if helper available
  try {
    if (helper && typeof helper.appendAudit === 'function') {
      helper.appendAudit({
        actor: 'sse_demo',
        phase: 'stream',
        type: eventType,
        session: sessionId,
        message: typeof data === 'string' ? data : JSON.stringify(data).slice(0,200),
        timestamp: new Date().toISOString()
      });
    }
  } catch (e) {
    console.warn('[sse_demo] appendAudit failed', e.message);
  }
}

function serveDemoPage(req, res) {
  const demoPath = path.resolve(__dirname, '..', 'duomotai', 'static', 'sse_demo.html');
  fs.readFile(demoPath, 'utf8', (err, html) => {
    if (err) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<html><body><h3>Demo page not found at ${demoPath}</h3><p>Create ${demoPath} to use demo UI.</p></body></html>`);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const method = req.method;
  const pathname = parsed.pathname;

  // Root: serve demo page
  if (method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    serveDemoPage(req, res);
    return;
  }

  // SSE endpoint: /sse/debate/:sessionId
  const sseMatch = pathname.match(/^\/sse\/debate\/(.+)$/);
  if (method === 'GET' && sseMatch) {
    const sessionId = sseMatch[1];
    // headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');

    // register
    if (!clientsBySession.has(sessionId)) clientsBySession.set(sessionId, []);
    clientsBySession.get(sessionId).push(res);
    console.log(`[sse_demo] client connected to session=${sessionId}; total=` + clientsBySession.get(sessionId).length);

    // send welcome event
    res.write(`event: connected\n`);
    res.write(`data: ${JSON.stringify({msg:'connected', session: sessionId})}\n\n`);

    // keep-alive ping
    const ping = setInterval(() => {
      try { res.write(`event: ping\ndata: ${JSON.stringify({ts: Date.now()})}\n\n`); } catch (e) {}
    }, 15000);

    // cleanup on close
    req.on('close', () => {
      clearInterval(ping);
      const arr = clientsBySession.get(sessionId) || [];
      const idx = arr.indexOf(res);
      if (idx !== -1) arr.splice(idx,1);
      console.log(`[sse_demo] client disconnected session=${sessionId}; total=` + (arr.length));
    });
    return;
  }

  // POST to broadcast: /debate/:sessionId/send
  const postMatch = pathname.match(/^\/debate\/(.+)\/send$/);
  if (method === 'POST' && postMatch) {
    const sessionId = postMatch[1];
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      let json = body;
      try { json = JSON.parse(body); } catch (e) { /* keep as raw */ }
      const text = (json && json.text) ? json.text : (typeof json === 'string' ? json : JSON.stringify(json));
      broadcast(sessionId, 'message', {text, session: sessionId, ts: new Date().toISOString()});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ok:true}));
    });
    return;
  }

  // fallback: list active sessions
  if (method === 'GET' && pathname === '/sessions') {
    const info = Array.from(clientsBySession.entries()).map(([k,v]) => ({session:k, clients:v.length}));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(info, null, 2));
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`[sse_demo] SSE demo server listening on http://localhost:${PORT}/`);
  console.log(`[sse_demo] SSE endpoint example: http://localhost:${PORT}/sse/debate/demo1`);
  console.log(`[sse_demo] Demo page: http://localhost:${PORT}/`);
});

// For graceful shutdown
process.on('SIGINT', () => { console.log('\n[sse_demo] Shutting down'); server.close(() => process.exit(0)); });
