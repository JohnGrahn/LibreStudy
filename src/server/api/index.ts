import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import userRoutes from './routes/users';
import deckRoutes from './routes/decks';
import cardRoutes from './routes/cards';
import testRoutes from './routes/tests';
import questionRoutes from './routes/questions';
import progressRoutes from './routes/progress';
import importExportRoutes from './routes/import-export';
import authRoutes from './routes/auth';
import { authMiddleware, AuthHonoEnv } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { errorMiddleware } from '../middleware/error';
import statsRoutes from './routes/stats';

const api = new Hono<AuthHonoEnv>();

// Middleware
api.use('*', logger());
api.use('*', prettyJSON());
api.use('*', cors());
api.onError(errorMiddleware);
api.use('*', rateLimitMiddleware);

// Public routes
api.route('/auth', authRoutes);

// Protected routes
api.use('*', authMiddleware);
api.route('/users', userRoutes);
api.route('/decks', deckRoutes);
api.route('/cards', cardRoutes);
api.route('/tests', testRoutes);
api.route('/questions', questionRoutes);
api.route('/progress', progressRoutes);
api.route('/import-export', importExportRoutes);
api.route('/stats', statsRoutes);

export default api; 