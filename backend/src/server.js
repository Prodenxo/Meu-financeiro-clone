import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { startMonthlyDasScheduler } from './services/mei-das.service.js';
import { bootstrapDatabase } from './services/db-bootstrap.service.js';

const app = express();

const normalizeOrigin = (value) => value.trim().replace(/\/$/, '');
const allowedOrigins = env.CORS_ORIGIN
  .split(',')
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

/** Permite origens de preview da Vercel (*.vercel.app) além da lista explícita em CORS_ORIGIN. */
const isVercelPreviewOrigin = (url) => {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'vercel.app' || hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    if (isVercelPreviewOrigin(normalizedOrigin)) {
      return callback(null, true);
    }

    // eslint-disable-next-line no-console
    console.warn('[CORS] Origem bloqueada:', normalizedOrigin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.use('/api', routes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await bootstrapDatabase();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[backend] falha no bootstrap do banco', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    startMonthlyDasScheduler();
    // eslint-disable-next-line no-console
    console.log(`[backend] rodando na porta ${env.PORT}`);
  });
};

if (process.env.VERCEL !== '1') {
  void startServer();
}

export default app;
