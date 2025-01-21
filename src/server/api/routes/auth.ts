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
  
  try {
    // Check if username exists
    const existingUsername = await AuthService.checkUsername(username);
    if (existingUsername) {
      return c.json({ error: 'Username already exists' }, 400);
    }

    // Check if email exists
    const existingEmail = await AuthService.checkEmail(email);
    if (existingEmail) {
      return c.json({ error: 'Email already exists' }, 400);
    }

    // Attempt registration
    const result = await AuthService.register(username, email, password);
    if (!result) {
      console.error('Registration failed: AuthService.register returned null');
      return c.json({ error: 'Registration failed' }, 500);
    }

    return c.json(result, 201);
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return c.json({ 
      error: error instanceof Error ? error.message : 'Registration failed',
      details: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

export default authRoutes; 