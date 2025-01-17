import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { userRoutes } from './routes/users';
import { deckRoutes } from './routes/decks';
import { cardRoutes } from './routes/cards';
import { testRoutes } from './routes/tests';
import { questionRoutes } from './routes/questions';

const api = new Hono();

// Middleware
api.use('*', cors());
api.use('*', logger());
api.use('*', prettyJSON());

// Routes
api.route('/users', userRoutes);
api.route('/decks', deckRoutes);
api.route('/cards', cardRoutes);
api.route('/tests', testRoutes);
api.route('/questions', questionRoutes);

// Error handling
api.onError((err, c) => {
  console.error(`${err}`);
  return c.json(
    {
      error: {
        message: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
      }
    },
    500
  );
});

export default api; 