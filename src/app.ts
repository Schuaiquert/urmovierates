import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import errorHandler from './middlewares/errorHandler';
import logger from './utils/logger';
import { swaggerSpec } from './config/swagger';
import { apiKeyAuth, API_KEY_HEADER } from './apiKey';
import movieRoutes from './routes/movieRoutes';
import userRoutes from './routes/userRoutes';
import reviewRoutes from './routes/reviewRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import authPublicRoutes from './routes/authPublicRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

// Security & Performance middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// ---------------------------------------------------------------------------
// Public endpoints (no X-API-Key required).
// Order matters: these must be registered BEFORE the global apiKeyAuth gate.
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger UI + its static assets (served by swagger-ui-express).
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public auth flows (no X-API-Key, no JWT).
app.use('/api/auth', authPublicRoutes);

// ---------------------------------------------------------------------------
// X-API-Key gate — applied to everything mounted below this line.
// ---------------------------------------------------------------------------
app.use(apiKeyAuth);

// Routes (protected by X-API-Key + (where applicable) JWT)
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Surfaces the configured header name in `app.locals` for ad-hoc introspection
// (e.g. tests). Not used by middleware itself.
app.locals.apiKeyHeader = API_KEY_HEADER;

export default app;
