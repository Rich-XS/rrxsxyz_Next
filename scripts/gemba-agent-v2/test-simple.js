// 简单测试 - 确保Node.js工作正常
console.log('============================================');
console.log('    Gemba Agent 2.0 - Simple Test');
console.log('============================================');
console.log('');
console.log('✅ Node.js is working!');
console.log('✅ Current directory:', __dirname);
console.log('✅ Node version:', process.version);
console.log('');

// 测试基本的HTTP请求
const http = require('http');

console.log('Testing HTTP request to localhost:8080...');

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/',
    method: 'GET',
    timeout: 3000
};

const req = http.request(options, (res) => {
    console.log(`✅ Server responded with status: ${res.statusCode}`);
    console.log('');
    console.log('Test completed successfully!');
    process.exit(0);
});

req.on('error', (err) => {
    console.log(`❌ Could not connect to localhost:8080`);
    console.log(`   Error: ${err.message}`);
    console.log('');
    console.log('Make sure your server is running on port 8080');
    console.log('You can start it with: python -m http.server 8080');
    process.exit(1);
});

req.on('timeout', () => {
    console.log('⏱️  Request timeout - server might be slow or not running');
    req.destroy();
});

req.end();