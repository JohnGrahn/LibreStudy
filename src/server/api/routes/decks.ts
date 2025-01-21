import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import deckModel from '../../models/DeckModel';
import cardModel from '../../models/CardModel';
import type { CreateDeckData, UpdateDeckData } from '../../models/DeckModel';
import type { CreateCardData } from '../../models/CardModel';
import type { AuthHonoEnv } from '../../middleware/auth';

const deckRoutes = new Hono<AuthHonoEnv>();

// Validation schemas
const createDeckSchema = z.object({
  title: z.string(),
  description: z.string().optional()
});

const updateDeckSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional()
});

const createCardSchema = z.object({
  front: z.string(),
  back: z.string(),
  interval: z.number().optional(),
  ease_factor: z.number().optional(),
  due_date: z.string().optional()
});

const updateCardSchema = z.object({
  front: z.string().optional(),
  back: z.string().optional(),
  interval: z.number().optional(),
  ease_factor: z.number().optional(),
  due_date: z.string().optional()
});

// Create a new deck
deckRoutes.post('/', zValidator('json', createDeckSchema), async (c) => {
  const input = c.req.valid('json');
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const data: CreateDeckData = {
    user_id: user.id,
    title: input.title,
    description: input.description
  };
  const deck = await deckModel.createDeck(data);
  return c.json(deck, 201);
});

// Get a deck by ID
deckRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const deck = await deckModel.getDeck(id, user.id);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }
  return c.json(deck);
});

// Get all decks for a user
deckRoutes.get('/', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const decks = await deckModel.getUserDecks(user.id);
  return c.json(decks);
});

// Update a deck
deckRoutes.patch('/:id', zValidator('json', updateDeckSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const input = c.req.valid('json');
  
  const data: UpdateDeckData = {
    title: input.title,
    description: input.description
  };
  
  const deck = await deckModel.updateDeck(id, user.id, data);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }
  return c.json(deck);
});

// Delete a deck
deckRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const deck = await deckModel.deleteDeck(id, user.id);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }
  return c.json(deck);
});

// Card routes nested under decks
// Get all cards in a deck
deckRoutes.get('/:id/cards', async (c) => {
  const deckId = parseInt(c.req.param('id'));
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user owns the deck
  const deck = await deckModel.getDeck(deckId, user.id);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  const cards = await cardModel.getDeckCards(deckId);
  return c.json(cards);
});

// Create a new card in a deck
deckRoutes.post('/:id/cards', zValidator('json', createCardSchema), async (c) => {
  const deckId = parseInt(c.req.param('id'));
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user owns the deck
  const deck = await deckModel.getDeck(deckId, user.id);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  const input = c.req.valid('json');
  const data: CreateCardData = {
    deck_id: deckId,
    front: input.front,
    back: input.back,
    interval: input.interval,
    ease_factor: input.ease_factor,
    due_date: input.due_date ? new Date(input.due_date) : undefined
  };

  const card = await cardModel.createCard(data);
  return c.json(card, 201);
});

// Update a card in a deck
deckRoutes.patch('/:id/cards/:cardId', zValidator('json', updateCardSchema), async (c) => {
  const deckId = parseInt(c.req.param('id'));
  const cardId = parseInt(c.req.param('cardId'));
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user owns the deck
  const deck = await deckModel.getDeck(deckId, user.id);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  const input = c.req.valid('json');
  
  // If this is a spaced repetition update (has interval, ease_factor, and due_date)
  if (input.interval !== undefined && input.ease_factor !== undefined && input.due_date !== undefined) {
    const card = await cardModel.updateSpacedRepetition(cardId, deckId, {
      interval: input.interval,
      ease_factor: input.ease_factor,
      due_date: new Date(input.due_date)
    });
    if (!card) {
      return c.json({ error: 'Card not found' }, 404);
    }
    return c.json(card);
  }

  // Otherwise, handle it as a regular card update
  const data = {
    front: input.front,
    back: input.back
  };

  const card = await cardModel.updateCard(cardId, deckId, data);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

// Delete a card from a deck
deckRoutes.delete('/:id/cards/:cardId', async (c) => {
  const deckId = parseInt(c.req.param('id'));
  const cardId = parseInt(c.req.param('cardId'));
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check if user owns the deck
  const deck = await deckModel.getDeck(deckId, user.id);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  const card = await cardModel.deleteCard(cardId, deckId);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

export default deckRoutes; 