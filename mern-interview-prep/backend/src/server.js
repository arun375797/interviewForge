const { createApp } = require('./app');

const app = createApp();
const PORT = process.env.PORT || 5000;

// Local / Render: listen on a port
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API running on port ${PORT}`);
  });
}

module.exports = app;
