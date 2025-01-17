import { Context, Next } from 'hono';
import { AuthHonoEnv } from './auth';

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

interface RequestLog {
  count: number;
  resetTime: number;
}

const requestLogs = new Map<string, RequestLog>();

export async function rateLimitMiddleware(c: Context<AuthHonoEnv>, next: Next) {
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Clean up old entries
  Array.from(requestLogs.entries()).forEach(([key, log]) => {
    if (now > log.resetTime) {
      requestLogs.delete(key);
    }
  });

  // Get or create request log
  let requestLog = requestLogs.get(ip);
  if (!requestLog || now > requestLog.resetTime) {
    requestLog = {
      count: 0,
      resetTime: now + WINDOW_MS
    };
  }

  // Check rate limit
  if (requestLog.count >= MAX_REQUESTS) {
    return c.json({
      error: 'Too many requests',
      resetTime: new Date(requestLog.resetTime).toISOString()
    }, 429);
  }

  // Update request count
  requestLog.count++;
  requestLogs.set(ip, requestLog);

  // Set rate limit headers
  c.header('X-RateLimit-Limit', MAX_REQUESTS.toString());
  c.header('X-RateLimit-Remaining', (MAX_REQUESTS - requestLog.count).toString());
  c.header('X-RateLimit-Reset', new Date(requestLog.resetTime).toISOString());

  await next();
} 