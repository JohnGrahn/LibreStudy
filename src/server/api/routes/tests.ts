import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { TestModel } from '../../models/test';
import { TestGeneratorService } from '../../services/testGenerator';

const testRoutes = new Hono();

// Validation schemas
const createTestSchema = z.object({
  user_id: z.number(),
  deck_id: z.number(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional()
});

const generateTestSchema = z.object({
  userId: z.number(),
  deckId: z.number(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  questionCount: z.number().min(1).max(50).optional(),
  questionTypes: z.array(
    z.enum(['multiple_choice', 'matching', 'fill_in_the_blank', 'true_false'])
  ).optional()
});

const updateTestSchema = createTestSchema.partial();

// Routes
testRoutes.post('/', zValidator('json', createTestSchema), async (c) => {
  const input = c.req.valid('json');
  const test = await TestModel.create({
    user_id: input.user_id,
    deck_id: input.deck_id,
    title: input.title,
    description: input.description
  });
  return c.json(test, 201);
});

testRoutes.post('/generate', zValidator('json', generateTestSchema), async (c) => {
  const input = c.req.valid('json');
  const test = await TestGeneratorService.generateTest({
    userId: input.userId,
    deckId: input.deckId,
    title: input.title,
    description: input.description,
    questionCount: input.questionCount,
    questionTypes: input.questionTypes
  });

  if (!test) {
    return c.json({ error: 'Failed to generate test' }, 400);
  }

  return c.json(test, 201);
});

testRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const test = await TestModel.findById(id);

  if (!test) {
    return c.json({ error: 'Test not found' }, 404);
  }

  return c.json(test);
});

testRoutes.get('/user/:userId', async (c) => {
  const userId = parseInt(c.req.param('userId'));
  const tests = await TestModel.findByUserId(userId);
  return c.json(tests);
});

testRoutes.get('/deck/:deckId', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));
  const tests = await TestModel.findByDeckId(deckId);
  return c.json(tests);
});

testRoutes.patch('/:id', zValidator('json', updateTestSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');

  // Check if test exists
  const existingTest = await TestModel.findById(id);
  if (!existingTest) {
    return c.json({ error: 'Test not found' }, 404);
  }

  const updatedTest = await TestModel.update(id, updates);
  return c.json(updatedTest);
});

testRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  // Check if test exists
  const existingTest = await TestModel.findById(id);
  if (!existingTest) {
    return c.json({ error: 'Test not found' }, 404);
  }

  await TestModel.delete(id);
  return c.json({ success: true });
});

export { testRoutes }; 