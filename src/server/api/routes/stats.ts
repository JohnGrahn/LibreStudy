import { Hono } from 'hono';
import { AuthHonoEnv } from '../../middleware/auth';
import userModel from '../../models/UserModel';
import deckModel from '../../models/DeckModel';
import testModel from '../../models/TestModel';

const statsRoutes = new Hono<AuthHonoEnv>();

statsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const userId = user.id;

  try {
    // Get user's decks
    const decks = await deckModel.getUserDecks(userId);
    
    // Get user's tests
    const tests = await testModel.getUserTests(userId);

    // Get total cards across all decks
    let totalCards = 0;
    for (const deck of decks) {
      const stats = await deckModel.getDeckStats(deck.id, userId);
      totalCards += stats.totalCards;
    }

    return c.json({
      totalDecks: decks.length,
      totalCards: totalCards,
      totalTests: tests.length,
      recentDecks: decks.slice(0, 5),  // Get 5 most recent decks
      recentTests: tests.slice(0, 5)    // Get 5 most recent tests
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

export default statsRoutes; 