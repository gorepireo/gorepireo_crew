const express = require('express');

let app = null;
let bootError = null;

try {
  const raw = require('./dist/index.js');
  app = (raw && raw.default) || raw;
} catch (err) {
  bootError = err;
  console.error('[BOOT-ERROR]:', err);
}

if (!app || typeof app !== 'function') {
  const fallback = express();
  fallback.all('*', (req, res) => {
    res.status(500).json({
      error: 'Backend Boot Failed on Vercel',
      message: bootError ? bootError.message : 'App was not exported as a function',
      stack: bootError ? bootError.stack : null,
      name: bootError ? bootError.name : null,
      nodeVersion: process.version,
      envVercel: process.env.VERCEL,
      cwd: process.cwd(),
      dirname: __dirname,
    });
  });
  app = fallback;
}

if (app && typeof app === 'function') {
  app.default = app;
}

module.exports = app;
