const express = require('express');

const app = express();

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', msg: 'hello from simple express', vercel: process.env.VERCEL });
});

module.exports = app;
module.exports.default = app;
