import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import userModel from '../models/UserModel';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthHonoEnv {
  Bindings: {},
  Variables: {
    user?: {
      id: number;
      username: string;
    };
  };
}

export type AuthHonoContext = Context<AuthHonoEnv>;

export async function authMiddleware(c: AuthHonoContext, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = await verify(token, JWT_SECRET);
    if (typeof payload !== 'object' || !payload || typeof payload.userId !== 'number') {
      return c.json({ error: 'Invalid token payload' }, 401);
    }
    
    // Verify user still exists
    const user = await userModel.findOne({ id: payload.userId });
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Add user to context
    c.set('user', {
      id: user.id,
      username: user.username
    });

    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
} 