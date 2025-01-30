import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import testModel from '../../models/TestModel';
import type { CreateTestData, UpdateTestData } from '../../models/TestModel';
import { TestGeneratorService } from '../../services/testGenerator';
import type { GenerateTestOptions } from '../../services/testGenerator';
import type { AuthHonoEnv } from '../../middleware/auth';

const testRoutes = new Hono<AuthHonoEnv>();

// Validation schemas
const createTestSchema = z.object({
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
  const user = c.get('user');
  
  const options: GenerateTestOptions = {
    userId: user.id,
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
  const user = c.get('user');
  
  const test = await testModel.getTest(id, user.id);
  if (!test) {
    return c.json({ error: 'Test not found' }, 404);
  }
  return c.json(test);
});

// Get all tests for a user
testRoutes.get('/', async (c) => {
  const user = c.get('user');
  const tests = await testModel.getUserTests(user.id);
  return c.json(tests);
});

// Update a test
testRoutes.patch('/:id', zValidator('json', updateTestSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user');
  const input = c.req.valid('json');
  
  const data: UpdateTestData = {
    title: input.title,
    description: input.description
  };
  
  const test = await testModel.updateTest(id, user.id, data);
  if (!test) {
    return c.json({ error: 'Test not found' }, 404);
  }
  return c.json(test);
});

// Submit test answers and get results
testRoutes.post('/:id/submit', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user');
  const answers = await c.req.json();
  
  const results = await testModel.getTestResults(id, user.id);
  if (!results) {
    return c.json({ error: 'Test not found' }, 404);
  }
  return c.json(results);
});

// Delete a test
testRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user');
  
  const test = await testModel.deleteTest(id, user.id);
  if (!test) {
    return c.json({ error: 'Test not found' }, 404);
  }
  return c.json(test);
});

export default testRoutes; 