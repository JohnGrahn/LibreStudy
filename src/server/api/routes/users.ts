import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { UserModel } from '../../models/user';

const userRoutes = new Hono();

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3).max(255),
  email: z.string().email().max(255),
  password_hash: z.string().min(60).max(255) // bcrypt hash length
});

const updateUserSchema = createUserSchema.partial();

// Routes
userRoutes.post('/', zValidator('json', createUserSchema), async (c) => {
  const input = c.req.valid('json');
  
  // Check if username or email already exists
  const [existingUsername, existingEmail] = await Promise.all([
    UserModel.findByUsername(input.username),
    UserModel.findByEmail(input.email)
  ]);

  if (existingUsername) {
    return c.json({ error: 'Username already taken' }, 400);
  }

  if (existingEmail) {
    return c.json({ error: 'Email already registered' }, 400);
  }

  const user = await UserModel.create({
    username: input.username,
    email: input.email,
    password_hash: input.password_hash
  });
  return c.json(user, 201);
});

userRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = await UserModel.findById(id);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

userRoutes.patch('/:id', zValidator('json', updateUserSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');

  // Check if user exists
  const existingUser = await UserModel.findById(id);
  if (!existingUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Check if username or email is being updated and if they're already taken
  if (updates.username) {
    const existingUsername = await UserModel.findByUsername(updates.username);
    if (existingUsername && existingUsername.id !== id) {
      return c.json({ error: 'Username already taken' }, 400);
    }
  }

  if (updates.email) {
    const existingEmail = await UserModel.findByEmail(updates.email);
    if (existingEmail && existingEmail.id !== id) {
      return c.json({ error: 'Email already registered' }, 400);
    }
  }

  const updatedUser = await UserModel.update(id, updates);
  return c.json(updatedUser);
});

userRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  
  // Check if user exists
  const existingUser = await UserModel.findById(id);
  if (!existingUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  await UserModel.delete(id);
  return c.json({ success: true });
});

export { userRoutes }; 