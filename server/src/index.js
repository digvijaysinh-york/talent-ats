import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { rankRouter } from './routes/rankRoutes.js';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'talent-ranking-api' });
});

app.use('/api/v1', rankRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code,
  });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
