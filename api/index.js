const express = require('express');

let app = null;
let bootError = null;

try {
  const raw = require('../server/dist/index.js');
  app = (raw && raw.default) || raw;
} catch (err) {
  bootError = err;
  console.error('[API-BOOT-ERROR]:', err);
}

if (!app || typeof app !== 'function') {
  const fallback = express();
  fallback.all('*', (req, res) => {
    res.status(500).json({
      error: 'API Serverless Function Boot Failed',
      message: bootError ? bootError.message : 'App was not exported as a function',
      stack: bootError ? bootError.stack : null,
      name: bootError ? bootError.name : null,
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
