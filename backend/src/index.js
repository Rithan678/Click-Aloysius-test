import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import eventsRouter from './routes/events.js';
import photosRouter from './routes/photos.js';
import devRouter from './routes/dev.js';

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map((o) => o.trim());

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'click-aloy-backend' });
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/photos', photosRouter);
app.use('/api/dev', devRouter);

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 API ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Startup failed', err.message);
    process.exit(1);
  });
