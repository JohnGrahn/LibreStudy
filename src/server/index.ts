import { serve } from "bun";
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import api from './api';

const app = new Hono();

// Configure CORS
app.use('*', cors({
  origin: ['http://localhost:3000'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

// Add performance middleware
app.use('*', logger());
app.use('*', prettyJSON());

// Add health check endpoint
app.get('/health', (c) => c.json({ status: 'ok' }));

// Mount API routes under /api
app.route('/api', api);

const port = parseInt(process.env.PORT || '3001');
console.log(`Started server: http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
  development: process.env.NODE_ENV !== 'production'
}; 