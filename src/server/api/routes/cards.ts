import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { CardModel } from '../../models/card';

const cardRoutes = new Hono();

// Validation schemas
const createCardSchema = z.object({
  deck_id: z.number(),
  front: z.string().min(1),
  back: z.string().min(1),
  interval: z.number().optional(),
  ease_factor: z.number().optional(),
  due_date: z.string().datetime().optional()
});

const updateCardSchema = createCardSchema.partial();

const reviewSchema = z.object({
  grade: z.number().min(0).max(5),
  cardId: z.number()
});

// Routes
cardRoutes.post('/', zValidator('json', createCardSchema), async (c) => {
  const input = c.req.valid('json');
  const card = await CardModel.create({
    deck_id: input.deck_id,
    front: input.front,
    back: input.back,
    interval: input.interval,
    ease_factor: input.ease_factor,
    due_date: input.due_date ? new Date(input.due_date) : undefined
  });
  return c.json(card, 201);
});

cardRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const card = await CardModel.findById(id);

  if (!card) {
    return c.json({ error: 'Card not found' }, 404);
  }

  return c.json(card);
});

cardRoutes.get('/deck/:deckId', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));
  const cards = await CardModel.findByDeckId(deckId);
  return c.json(cards);
});

cardRoutes.get('/deck/:deckId/due', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));
  const limit = parseInt(c.req.query('limit') || '10');
  const cards = await CardModel.getDueCards(deckId, limit);
  return c.json(cards);
});

cardRoutes.patch('/:id', zValidator('json', updateCardSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');

  // Check if card exists
  const existingCard = await CardModel.findById(id);
  if (!existingCard) {
    return c.json({ error: 'Card not found' }, 404);
  }

  // Convert due_date string to Date if present
  const processedUpdates = {
    ...updates,
    due_date: updates.due_date ? new Date(updates.due_date) : undefined
  };

  const updatedCard = await CardModel.update(id, processedUpdates);
  return c.json(updatedCard);
});

cardRoutes.patch('/:id/spaced-repetition', zValidator('json', reviewSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { grade } = c.req.valid('json');

  // Check if card exists
  const existingCard = await CardModel.findById(id);
  if (!existingCard) {
    return c.json({ error: 'Card not found' }, 404);
  }

  const updatedCard = await CardModel.updateSpacedRepetition(
    id,
    grade,
    existingCard.ease_factor || 2.5,
    new Date()
  );
  return c.json(updatedCard);
});

cardRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  // Check if card exists
  const existingCard = await CardModel.findById(id);
  if (!existingCard) {
    return c.json({ error: 'Card not found' }, 404);
  }

  await CardModel.delete(id);
  return c.json({ success: true });
});

export { cardRoutes }; 