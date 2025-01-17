import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { userRoutes } from './routes/users';
import { deckRoutes } from './routes/decks';
import { cardRoutes } from './routes/cards';
import { testRoutes } from './routes/tests';
import { questionRoutes } from './routes/questions';
import { authRoutes } from './routes/auth';
import { authMiddleware, AuthHonoEnv } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { errorMiddleware } from '../middleware/error';

const api = new Hono<AuthHonoEnv>();

// Global middleware
api.use('*', cors());
api.use('*', logger());
api.use('*', prettyJSON());
api.use('*', rateLimitMiddleware);

// Public routes
api.route('/auth', authRoutes);

// Protected routes
api.use('/users/*', authMiddleware);
api.use('/decks/*', authMiddleware);
api.use('/cards/*', authMiddleware);
api.use('/tests/*', authMiddleware);
api.use('/questions/*', authMiddleware);

api.route('/users', userRoutes);
api.route('/decks', deckRoutes);
api.route('/cards', cardRoutes);
api.route('/tests', testRoutes);
api.route('/questions', questionRoutes);

// Error handling
api.onError(errorMiddleware);

export default api; 