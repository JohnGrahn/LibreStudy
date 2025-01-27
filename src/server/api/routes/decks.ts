import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import deckModel from '../../models/DeckModel';
import cardModel from '../../models/CardModel';
import userCardProgressModel from '../../models/UserCardProgressModel';
import type { CreateDeckData, UpdateDeckData } from '../../models/DeckModel';
import type { CreateCardData } from '../../models/CardModel';
import type { AuthHonoEnv } from '../../middleware/auth';

const deckRoutes = new Hono<AuthHonoEnv>();

// Validation schemas
const createDeckSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  is_public: z.boolean().optional()
});

const updateDeckSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  is_public: z.boolean().optional()
});

const createCardSchema = z.object({
  front: z.string(),
  back: z.string(),
  last_grade: z.number().optional()
});

const updateCardSchema = z.object({
  front: z.string().optional(),
  back: z.string().optional(),
  last_grade: z.number().optional()
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
    description: input.description,
    is_public: input.is_public
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

  const type = c.req.query('type');
  
  if (type === 'public') {
    const decks = await deckModel.getPublicDecks();
    return c.json(decks);
  } else {
    const decks = await deckModel.getUserDecks(user.id);
    return c.json(decks);
  }
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
    description: input.description,
    is_public: input.is_public
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

  // Check if user owns the deck or if it's public
  const deck = await deckModel.getDeck(deckId, user.id);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  const cards = await cardModel.getDeckCards(deckId, user.id);
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
  if (!deck || deck.user_id !== user.id) {
    return c.json({ error: 'Unauthorized: You can only add cards to your own decks' }, 403);
  }

  const input = c.req.valid('json');
  const data: CreateCardData = {
    deck_id: deckId,
    front: input.front,
    back: input.back,
    last_grade: input.last_grade
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

  const input = c.req.valid('json');
  const deck = await deckModel.getDeck(deckId, user.id);
  
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  // If updating last_grade, use user_card_progress instead of modifying the original card
  if (input.last_grade !== undefined) {
    const progress = await userCardProgressModel.updateProgress(user.id, cardId, input.last_grade);
    return c.json(progress);
  }

  // For other card updates (front/back), require deck ownership
  if (deck.user_id !== user.id) {
    return c.json({ error: 'Unauthorized: You can only modify card content in your own decks' }, 403);
  }

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
  if (!deck || deck.user_id !== user.id) {
    return c.json({ error: 'Unauthorized: You can only delete cards from your own decks' }, 403);
  }

  const card = await cardModel.deleteCard(cardId, deckId);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

// Get user's progress on all cards in a deck
deckRoutes.get('/:id/progress', async (c) => {
  const deckId = parseInt(c.req.param('id'));
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const deck = await deckModel.getDeck(deckId, user.id);
  if (!deck) {
    return c.json({ error: 'Deck not found' }, 404);
  }

  const progress = await userCardProgressModel.getDeckProgress(user.id, deckId);
  return c.json(progress);
});

export default deckRoutes; 