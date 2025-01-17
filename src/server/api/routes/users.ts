import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import userModel from '../../models/UserModel';
import type { CreateUserData, UpdateUserData } from '../../models/UserModel';

const userRoutes = new Hono();

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3).max(255),
  email: z.string().email(),
  password: z.string().min(6)
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional()
});

// Routes
userRoutes.post('/', zValidator('json', createUserSchema), async (c) => {
  const input = c.req.valid('json');
  const data: CreateUserData = {
    username: input.username,
    email: input.email,
    password: input.password
  };

  // Check if username is taken
  const existingUsername = await userModel.findByUsername(data.username);
  if (existingUsername) {
    return c.json({ error: 'Username already taken' }, 400);
  }

  // Check if email is taken
  const existingEmail = await userModel.findByEmail(data.email);
  if (existingEmail) {
    return c.json({ error: 'Email already taken' }, 400);
  }

  const user = await userModel.createUser(data);
  return c.json(user, 201);
});

userRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = await userModel.findById(id);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

userRoutes.patch('/:id', zValidator('json', updateUserSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');

  // Check if user exists
  const existingUser = await userModel.findById(id);
  if (!existingUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Check if username is taken
  if (data.username) {
    const existingUsername = await userModel.findByUsername(data.username);
    if (existingUsername && existingUsername.id !== id) {
      return c.json({ error: 'Username already taken' }, 400);
    }
  }

  // Check if email is taken
  if (data.email) {
    const existingEmail = await userModel.findByEmail(data.email);
    if (existingEmail && existingEmail.id !== id) {
      return c.json({ error: 'Email already taken' }, 400);
    }
  }

  const user = await userModel.updateUser(id, data);
  return c.json(user);
});

userRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  // Check if user exists
  const existingUser = await userModel.findById(id);
  if (!existingUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  await userModel.deleteUser(id);
  return c.json({ message: 'User deleted successfully' });
});

export default userRoutes; 