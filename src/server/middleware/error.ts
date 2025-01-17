import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { AuthHonoEnv } from './auth';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export async function errorMiddleware(err: Error, c: Context<AuthHonoEnv>) {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);

  // Handle different types of errors
  if (err instanceof HTTPException) {
    return c.json({
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' ? { details: err.getResponse() } : {})
      }
    }, err.status as 400 | 401 | 403 | 404 | 429 | 500);
  }

  if (err instanceof ZodError) {
    return c.json({
      error: {
        message: 'Validation Error',
        details: process.env.NODE_ENV === 'development' ? err.errors : undefined
      }
    }, 400);
  }

  if (err instanceof AppError) {
    return c.json({
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' ? { details: err.details } : {})
      }
    }, err.statusCode as 400 | 401 | 403 | 404 | 429 | 500);
  }

  // Default error response
  return c.json({
    error: {
      message: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {})
    }
  }, 500);
} 