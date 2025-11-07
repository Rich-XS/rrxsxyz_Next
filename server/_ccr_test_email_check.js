(async () => {
  try {
    const svc = require('./services/emailService');
    console.log('Loaded emailService, ensureInitialized type:', typeof svc.ensureInitialized);

    const ok = await svc.ensureInitialized();
    console.log('ensureInitialized ->', ok);
    console.log('transporter exists ->', !!svc.transporter);

    try {
      await svc.sendTestEmail('rrxs@example.com');
      console.log('sendTestEmail unexpectedly succeeded');
    } catch (e) {
      console.log('sendTestEmail error (expected):', e.message);
    }
  } catch (err) {
    console.error('Fatal error when requiring emailService:', err && err.message);
    process.exit(2);
  }
})();
