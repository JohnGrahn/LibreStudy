import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import testModel from '../../models/TestModel';
import type { CreateTestData, UpdateTestData } from '../../models/TestModel';
import { TestGeneratorService } from '../../services/testGenerator';
import type { GenerateTestOptions } from '../../services/testGenerator';

const testRoutes = new Hono();

// Validation schemas
const createTestSchema = z.object({
  user_id: z.number(),
  deck_id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  question_count: z.number().optional()
});

const updateTestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional()
});

// Create a new test
testRoutes.post('/', zValidator('json', createTestSchema), async (c) => {
  const input = c.req.valid('json');
  
  const options: GenerateTestOptions = {
    userId: input.user_id,
    deckId: input.deck_id,
    title: input.title,
    description: input.description,
    questionCount: input.question_count
  };

  const test = await TestGeneratorService.generateTest(options);
  if (!test) {
    return c.json({ error: 'Failed to generate test' }, 400);
  }
  return c.json(test, 201);
});

// Get a test by ID
testRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const userId = parseInt(c.req.query('user_id') || '0');
  
  const test = await testModel.getTest(id, userId);
  if (!test) {
    return c.json({ error: 'Test not found' }, 404);
  }
  return c.json(test);
});

// Get all tests for a user
testRoutes.get('/', async (c) => {
  const userId = parseInt(c.req.query('user_id') || '0');
  const tests = await testModel.getUserTests(userId);
  return c.json(tests);
});

// Update a test
testRoutes.patch('/:id', zValidator('json', updateTestSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const userId = parseInt(c.req.query('user_id') || '0');
  const input = c.req.valid('json');
  
  const data: UpdateTestData = {
    title: input.title,
    description: input.description
  };
  
  const test = await testModel.updateTest(id, userId, data);
  if (!test) {
    return c.json({ error: 'Test not found' }, 404);
  }
  return c.json(test);
});

// Submit test answers and get results
testRoutes.post('/:id/submit', async (c) => {
  const id = parseInt(c.req.param('id'));
  const userId = parseInt(c.req.query('user_id') || '0');
  const answers = await c.req.json();
  
  const results = await testModel.getTestResults(id, userId);
  if (!results) {
    return c.json({ error: 'Test not found' }, 404);
  }
  return c.json(results);
});

// Delete a test
testRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const userId = parseInt(c.req.query('user_id') || '0');
  
  const test = await testModel.deleteTest(id, userId);
  if (!test) {
    return c.json({ error: 'Test not found' }, 404);
  }
  return c.json(test);
});

export default testRoutes; 