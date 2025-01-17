import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import cardModel from '../../models/CardModel';
import type { CreateCardData, UpdateCardData } from '../../models/CardModel';

const cardRoutes = new Hono();

// Validation schemas
const createCardSchema = z.object({
  deck_id: z.number(),
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

// Create a new card
cardRoutes.post('/', zValidator('json', createCardSchema), async (c) => {
  const input = c.req.valid('json');
  const data: CreateCardData = {
    deck_id: input.deck_id,
    front: input.front,
    back: input.back,
    interval: input.interval,
    ease_factor: input.ease_factor,
    due_date: input.due_date ? new Date(input.due_date) : undefined
  };
  const card = await cardModel.createCard(data);
  return c.json(card, 201);
});

// Get a card by ID
cardRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const deckId = parseInt(c.req.query('deck_id') || '0');
  
  const card = await cardModel.getCard(id, deckId);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

// Get all cards in a deck
cardRoutes.get('/', async (c) => {
  const deckId = parseInt(c.req.query('deck_id') || '0');
  const cards = await cardModel.getDeckCards(deckId);
  return c.json(cards);
});

// Get due cards
cardRoutes.get('/due/:deckId', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));
  const cards = await cardModel.getDueCards(deckId);
  return c.json(cards);
});

// Update a card
cardRoutes.patch('/:id', zValidator('json', updateCardSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const deckId = parseInt(c.req.query('deck_id') || '0');
  const input = c.req.valid('json');
  
  const data: UpdateCardData = {
    front: input.front,
    back: input.back,
    interval: input.interval,
    ease_factor: input.ease_factor,
    due_date: input.due_date ? new Date(input.due_date) : undefined
  };
  
  const card = await cardModel.updateCard(id, deckId, data);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

// Update spaced repetition data
cardRoutes.patch('/:id/srs', async (c) => {
  const id = parseInt(c.req.param('id'));
  const deckId = parseInt(c.req.query('deck_id') || '0');
  const input = await c.req.json();
  
  const data = {
    interval: input.interval,
    ease_factor: input.ease_factor,
    due_date: new Date(input.due_date)
  };
  
  const card = await cardModel.updateSpacedRepetition(id, deckId, data);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

// Delete a card
cardRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const deckId = parseInt(c.req.query('deck_id') || '0');
  
  const card = await cardModel.deleteCard(id, deckId);
  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }
  return c.json(card);
});

export default cardRoutes; 