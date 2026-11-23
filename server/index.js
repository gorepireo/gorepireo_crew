const raw = require('./dist/index.js');
const app = (raw && raw.default) || raw;

// Support both CommonJS and ESM default consumers
if (app && typeof app === 'function') {
  app.default = app;
}

module.exports = app;
