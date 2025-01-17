import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { QuestionModel, QuestionType } from '../../models/question';

const questionRoutes = new Hono();

// Validation schemas
const questionOptionSchema = z.object({
  content: z.string().min(1),
  is_correct: z.boolean().optional(),
  match_id: z.number().optional()
});

const createQuestionSchema = z.object({
  test_id: z.number(),
  card_id: z.number(),
  type: z.enum(['multiple_choice', 'matching', 'fill_in_the_blank', 'true_false'] as [QuestionType, ...QuestionType[]]),
  content: z.string().min(1),
  options: z.array(z.object({
    content: z.string().min(1),
    is_correct: z.boolean().optional(),
    match_id: z.number().optional()
  })).optional()
});

const updateQuestionSchema = z.object({
  test_id: z.number().optional(),
  card_id: z.number().optional(),
  type: z.enum(['multiple_choice', 'matching', 'fill_in_the_blank', 'true_false'] as [QuestionType, ...QuestionType[]]).optional(),
  content: z.string().min(1).optional()
});

const updateOptionsSchema = z.array(z.object({
  content: z.string().min(1),
  is_correct: z.boolean().optional(),
  match_id: z.number().optional()
}));

// Routes
questionRoutes.post('/', zValidator('json', createQuestionSchema), async (c) => {
  const input = c.req.valid('json');
  const question = await QuestionModel.create({
    test_id: input.test_id,
    card_id: input.card_id,
    type: input.type,
    content: input.content,
    options: input.options?.map(opt => ({
      content: opt.content,
      is_correct: opt.is_correct,
      match_id: opt.match_id
    }))
  });
  return c.json(question, 201);
});

questionRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const question = await QuestionModel.findById(id);

  if (!question) {
    return c.json({ error: 'Question not found' }, 404);
  }

  // Get options if they exist
  const options = await QuestionModel.getOptions(id);
  return c.json({ ...question, options });
});

questionRoutes.get('/test/:testId', async (c) => {
  const testId = parseInt(c.req.param('testId'));
  const questions = await QuestionModel.findByTestId(testId);

  // Get options for each question
  const questionsWithOptions = await Promise.all(
    questions.map(async (question) => {
      const options = await QuestionModel.getOptions(question.id);
      return { ...question, options };
    })
  );

  return c.json(questionsWithOptions);
});

questionRoutes.patch('/:id', zValidator('json', updateQuestionSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');

  // Check if question exists
  const existingQuestion = await QuestionModel.findById(id);
  if (!existingQuestion) {
    return c.json({ error: 'Question not found' }, 404);
  }

  const updatedQuestion = await QuestionModel.update(id, updates);
  return c.json(updatedQuestion);
});

questionRoutes.patch('/:id/options', zValidator('json', updateOptionsSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const options = c.req.valid('json').map(opt => ({
    content: opt.content,
    is_correct: opt.is_correct,
    match_id: opt.match_id
  }));

  // Check if question exists
  const existingQuestion = await QuestionModel.findById(id);
  if (!existingQuestion) {
    return c.json({ error: 'Question not found' }, 404);
  }

  // Update options
  const updatedOptions = await QuestionModel.updateOptions(id, options);
  return c.json(updatedOptions);
});

questionRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  // Check if question exists
  const existingQuestion = await QuestionModel.findById(id);
  if (!existingQuestion) {
    return c.json({ error: 'Question not found' }, 404);
  }

  await QuestionModel.delete(id);
  return c.json({ success: true });
});

export { questionRoutes }; 