const app = require('./dist/index.js');

// Support both CommonJS and ESM default consumers
if (app && typeof app === 'function') {
  app.default = app;
}

module.exports = app;
