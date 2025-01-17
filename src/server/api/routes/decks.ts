import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { DeckModel } from '../../models/deck';

const deckRoutes = new Hono();

// Validation schemas
const createDeckSchema = z.object({
  user_id: z.number(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional()
});

const updateDeckSchema = createDeckSchema.partial();

// Routes
deckRoutes.post('/', zValidator('json', createDeckSchema), async (c) => {
  const input = c.req.valid('json');
  const deck = await DeckModel.create({
    user_id: input.user_id,
    title: input.title,
    description: input.description
  });
  return c.json(deck, 201);
});

deckRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const deck = await DeckModel.findById(id);

  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  return c.json(deck);
});

deckRoutes.get('/user/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));
  const decks = await DeckModel.findByUserId(userId);
  return c.json(decks);
});

deckRoutes.get('/search', async (c) => {
  const userId = parseInt(c.req.query('userId') || '');
  const query = c.req.query('q') || '';

  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400);
  }

  const decks = await DeckModel.search(userId, query);
  return c.json(decks);
});

deckRoutes.patch('/:id', zValidator('json', updateDeckSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');

  // Check if deck exists
  const existingDeck = await DeckModel.findById(id);
  if (!existingDeck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  const updatedDeck = await DeckModel.update(id, updates);
  return c.json(updatedDeck);
});

deckRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  // Check if deck exists
  const existingDeck = await DeckModel.findById(id);
  if (!existingDeck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  await DeckModel.delete(id);
  return c.json({ success: true });
});

export { deckRoutes }; 