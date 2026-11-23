const raw = require('./dist/index.js');
const app = (raw && raw.default) || raw;

if (app && typeof app === 'function') {
  app.default = app;
}

module.exports = app;
