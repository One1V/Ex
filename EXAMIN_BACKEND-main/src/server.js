import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { env } from './config/env.js';

const app = express();
app.use(helmet());

// CORS: restrict to an allowed origins array (comma-separated via CORS_ORIGINS)
const defaultAllowed = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://examin-three.vercel.app',
];
const envAllowed = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...envAllowed, ...defaultAllowed])];

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
}));
// Optional: handle preflight for all routes
app.options('*', cors());
app.use(express.json());
app.use(morgan('dev'));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(env.PORT, () => console.log(`API listening on :${env.PORT}`));
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
