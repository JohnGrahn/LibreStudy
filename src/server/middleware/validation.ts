import { Context, Next } from 'hono';
import { AuthHonoEnv } from './auth';

export function validateId(paramName: string = 'id') {
  return async (c: Context<AuthHonoEnv>, next: Next) => {
    const id = parseInt(c.req.param(paramName));
    if (isNaN(id) || id <= 0) {
      return c.json({ error: `Invalid ${paramName}` }, 400);
    }
    await next();
  };
}

export function validateOwnership(resourceType: string) {
  return async (c: Context<AuthHonoEnv>, next: Next) => {
    const id = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get the resource from the database based on type
    let resource;
    switch (resourceType) {
      case 'deck':
        const { DeckModel } = await import('../models/deck');
        resource = await DeckModel.findById(id);
        break;
      case 'test':
        const { TestModel } = await import('../models/test');
        resource = await TestModel.findById(id);
        break;
      default:
        return c.json({ error: 'Invalid resource type' }, 400);
    }

    if (!resource) {
      return c.json({ error: `${resourceType} not found` }, 404);
    }

    if (resource.user_id !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
} 