import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import deckModel from '../../models/DeckModel';
import type { CreateDeckData, UpdateDeckData } from '../../models/DeckModel';

const deckRoutes = new Hono();

// Validation schemas
const createDeckSchema = z.object({
  user_id: z.number(),
  title: z.string(),
  description: z.string().optional()
});

const updateDeckSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional()
});

// Create a new deck
deckRoutes.post('/', zValidator('json', createDeckSchema), async (c) => {
  const input = c.req.valid('json');
  const data: CreateDeckData = {
    user_id: input.user_id,
    title: input.title,
    description: input.description
  };
  const deck = await deckModel.createDeck(data);
  return c.json(deck, 201);
});

// Get a deck by ID
deckRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const userId = parseInt(c.req.query('user_id') || '0');
  
  const deck = await deckModel.getDeck(id, userId);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }
  return c.json(deck);
});

// Get all decks for a user
deckRoutes.get('/', async (c) => {
  const userId = parseInt(c.req.query('user_id') || '0');
  const decks = await deckModel.getUserDecks(userId);
  return c.json(decks);
});

// Update a deck
deckRoutes.patch('/:id', zValidator('json', updateDeckSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const userId = parseInt(c.req.query('user_id') || '0');
  const input = c.req.valid('json');
  
  const data: UpdateDeckData = {
    title: input.title,
    description: input.description
  };
  
  const deck = await deckModel.updateDeck(id, userId, data);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }
  return c.json(deck);
});

// Delete a deck
deckRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const userId = parseInt(c.req.query('user_id') || '0');
  
  const deck = await deckModel.deleteDeck(id, userId);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }
  return c.json(deck);
});

export default deckRoutes; 