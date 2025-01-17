import { Hono } from 'hono';
import { AuthHonoEnv } from '../../middleware/auth';
import { ProgressTrackingService } from '../../services/progressTracking';

const progressRoutes = new Hono<AuthHonoEnv>();

// Get overall study statistics
progressRoutes.get('/stats/study', async (c) => {
  const user = c.get('user');
  const stats = await ProgressTrackingService.getStudyStats(user.id);
  return c.json(stats);
});

// Get test statistics
progressRoutes.get('/stats/tests', async (c) => {
  const user = c.get('user');
  const stats = await ProgressTrackingService.getTestStats(user.id);
  return c.json(stats);
});

// Get progress for all decks
progressRoutes.get('/decks', async (c) => {
  const user = c.get('user');
  const progress = await ProgressTrackingService.getDeckProgress(user.id);
  return c.json(progress);
});

// Get detailed progress for a specific deck
progressRoutes.get('/decks/:deckId', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));
  const user = c.get('user');

  const progress = await ProgressTrackingService.getDeckDetailedProgress(deckId, user.id);
  if (!progress) {
    return c.json({ error: 'Failed to get deck progress' }, 404);
  }

  return c.json(progress);
});

export default progressRoutes; 