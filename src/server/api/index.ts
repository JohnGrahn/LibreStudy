import { Hono } from 'hono';
import { authMiddleware, AuthHonoEnv } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { errorMiddleware } from '../middleware/error';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { deckRoutes } from './routes/decks';
import { cardRoutes } from './routes/cards';
import { testRoutes } from './routes/tests';
import { questionRoutes } from './routes/questions';
import { importExportRoutes } from './routes/import-export';
import { progressRoutes } from './routes/progress';

// Create the main API router
const api = new Hono<AuthHonoEnv>();

// Apply global middleware
api.use('*', rateLimitMiddleware);
api.onError(errorMiddleware);

// Public routes
api.route('/auth', authRoutes);

// Protected routes
api.use('/*', authMiddleware);
api.route('/users', userRoutes);
api.route('/decks', deckRoutes);
api.route('/cards', cardRoutes);
api.route('/tests', testRoutes);
api.route('/questions', questionRoutes);
api.route('/import-export', importExportRoutes);
api.route('/progress', progressRoutes);

export default api; 