import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AuthService } from '../../services/auth';
import { AuthHonoEnv } from '../../middleware/auth';

const authRoutes = new Hono<AuthHonoEnv>();

// Validation schemas
const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(8)
});

const registerSchema = z.object({
  username: z.string().min(3).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8).max(255)
});

// Routes
authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { emailOrUsername, password } = c.req.valid('json');
  
  const result = await AuthService.login(emailOrUsername, password);
  if (!result) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  return c.json(result);
});

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const { username, email, password } = c.req.valid('json');
  
  const result = await AuthService.register(username, email, password);
  if (!result) {
    return c.json({ error: 'Username or email already exists' }, 400);
  }

  return c.json(result, 201);
});

export { authRoutes }; 