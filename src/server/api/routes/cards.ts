import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import cardModel from '../../models/CardModel';
import deckModel from '../../models/DeckModel';
import type { CreateCardData, UpdateCardData } from '../../models/CardModel';
import type { AuthHonoEnv } from '../../middleware/auth';

const cardRoutes = new Hono<AuthHonoEnv>();

// Validation schemas
const createCardSchema = z.object({
  deck_id: z.number(),
  front: z.string(),
  back: z.string(),
  last_grade: z.number().optional()
});

const updateCardSchema = z.object({
  front: z.string().optional(),
  back: z.string().optional(),
  last_grade: z.number().optional()
});

// Helper function to check deck ownership
async function checkDeckOwnership(deckId: number, userId: number) {
  const deck = await deckModel.getDeck(deckId, userId);
  return !!deck;
}

// Create a new card
cardRoutes.post('/', zValidator('json', createCardSchema), async (c) => {
  const input = c.req.valid('json');
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user owns the deck
  if (!await checkDeckOwnership(input.deck_id, user.id)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const data: CreateCardData = {
    deck_id: input.deck_id,
    front: input.front,
    back: input.back,
    last_grade: input.last_grade || 0
  };
  const card = await cardModel.createCard(data);
  return c.json(card, 201);
});

// Get all cards in a deck
cardRoutes.get('/', async (c) => {
  const deckId = parseInt(c.req.query('deck_id') || '0');
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user owns the deck
  if (!await checkDeckOwnership(deckId, user.id)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const cards = await cardModel.getDeckCards(deckId);
  return c.json(cards);
});

// Get a card by ID
cardRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const deckId = parseInt(c.req.query('deck_id') || '0');
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user owns the deck
  if (!await checkDeckOwnership(deckId, user.id)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const card = await cardModel.getCard(id, deckId);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

// Update a card
cardRoutes.patch('/:id', zValidator('json', updateCardSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const deckId = parseInt(c.req.query('deck_id') || '0');
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user owns the deck
  if (!await checkDeckOwnership(deckId, user.id)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const input = c.req.valid('json');
  const data: UpdateCardData = {
    front: input.front,
    back: input.back,
    last_grade: input.last_grade
  };
  
  const card = await cardModel.updateCard(id, deckId, data);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

// Delete a card
cardRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const deckId = parseInt(c.req.query('deck_id') || '0');
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user owns the deck
  if (!await checkDeckOwnership(deckId, user.id)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const card = await cardModel.deleteCard(id, deckId);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

export default cardRoutes; 