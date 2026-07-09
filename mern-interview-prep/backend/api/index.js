const { createApp } = require('../src/app');

const app = createApp();

// Vercel Node serverless expects a default export that is an Express app / handler
module.exports = app;
