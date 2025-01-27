import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Serve static files
app.use('/*', serveStatic({ root: './dist' }));

// Proxy API requests to backend
app.all('/api/*', async (c) => {
  try {
    const backendUrl = process.env.VITE_API_URL || 'http://backend:3001';
    const url = new URL(c.req.url);
    const targetUrl = backendUrl + url.pathname + url.search;

    console.log(`Proxying request to: ${targetUrl}`);

    const headers = new Headers();
    for (const [key, value] of c.req.raw.headers.entries()) {
      if (key !== 'host') { // Skip the host header
        headers.set(key, value);
      }
    }

    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers,
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.raw.blob() : undefined
    });

    // Forward the response headers
    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      responseHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Backend service unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', serveStatic({ path: './dist/index.html' }));

export default {
  port: 3000,
  fetch: app.fetch
}; 