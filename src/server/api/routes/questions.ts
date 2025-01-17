import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import questionModel from '../../models/QuestionModel';
import type { QuestionType, CreateQuestionData, UpdateQuestionData, QuestionOption } from '../../models/QuestionModel';

const questionRoutes = new Hono();

// Validation schemas
const questionOptionSchema = z.object({
  id: z.number().optional(),
  content: z.string().min(1),
  is_correct: z.boolean().optional(),
  match_id: z.number().optional()
});

const createQuestionSchema = z.object({
  test_id: z.number(),
  card_id: z.number(),
  content: z.string().min(1),
  type: z.enum(['multiple_choice', 'true_false', 'fill_in_the_blank', 'matching']),
  options: z.array(questionOptionSchema).optional()
});

const updateQuestionSchema = z.object({
  content: z.string().min(1).optional(),
  type: z.enum(['multiple_choice', 'true_false', 'fill_in_the_blank', 'matching']).optional()
});

const updateOptionsSchema = z.array(questionOptionSchema);

// Create a new question
questionRoutes.post('/', zValidator('json', createQuestionSchema), async (c) => {
  const input = c.req.valid('json');
  const data: CreateQuestionData = {
    test_id: input.test_id,
    card_id: input.card_id,
    content: input.content,
    type: input.type,
    options: input.options && input.options.map(opt => ({
      content: opt.content,
      is_correct: opt.is_correct,
      match_id: opt.match_id
    }))
  };
  const question = await questionModel.createQuestion(data);
  return c.json(question, 201);
});

// Get a question by ID
questionRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const testId = parseInt(c.req.query('test_id') || '0');
  
  const question = await questionModel.getQuestion(id, testId);
  if (!question) {
    return c.json({ error: 'Question not found' }, 404);
  }
  return c.json(question);
});

// Get all questions for a test
questionRoutes.get('/', async (c) => {
  const testId = parseInt(c.req.query('test_id') || '0');
  const questions = await questionModel.getTestQuestions(testId);
  return c.json(questions);
});

// Update a question
questionRoutes.patch('/:id', zValidator('json', updateQuestionSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const testId = parseInt(c.req.query('test_id') || '0');
  const input = c.req.valid('json');
  
  const data: UpdateQuestionData = {
    content: input.content,
    type: input.type
  };
  
  const question = await questionModel.updateQuestion(id, testId, data);
  if (!question) {
    return c.json({ error: 'Question not found' }, 404);
  }
  return c.json(question);
});

// Update question options
questionRoutes.patch('/:id/options', zValidator('json', updateOptionsSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const input = c.req.valid('json');
  
  const options = input.map(opt => ({
    content: opt.content,
    is_correct: opt.is_correct,
    match_id: opt.match_id
  }));
  
  const updatedOptions = await questionModel.updateQuestionOptions(id, options);
  return c.json(updatedOptions);
});

// Delete a question
questionRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const testId = parseInt(c.req.query('test_id') || '0');
  
  const question = await questionModel.deleteQuestion(id, testId);
  if (!question) {
    return c.json({ error: 'Question not found' }, 404);
  }
  return c.json(question);
});

export default questionRoutes; 