import express from 'express';

const app = express();

app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', msg: 'hello from simple express', vercel: process.env.VERCEL });
});

export default app;
