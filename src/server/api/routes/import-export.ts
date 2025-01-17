import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ImportExportService } from '../../services/importExport';
import { AuthHonoEnv } from '../../middleware/auth';

const importExportRoutes = new Hono<AuthHonoEnv>();

// Validation schemas
const importJSONSchema = z.object({
  jsonData: z.string()
});

const importCSVSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  csvData: z.string()
});

// Routes
importExportRoutes.post('/import/json', zValidator('json', importJSONSchema), async (c) => {
  const { jsonData } = c.req.valid('json');
  const user = c.get('user');

  // Validate the imported data structure
  try {
    const parsedData = JSON.parse(jsonData);
    if (!ImportExportService.validateImportedData(parsedData)) {
      return c.json({ error: 'Invalid deck data structure' }, 400);
    }
  } catch (error) {
    return c.json({ error: 'Invalid JSON data' }, 400);
  }

  const deck = await ImportExportService.importDeckFromJSON(user.id, jsonData);
  if (!deck) {
    return c.json({ error: 'Failed to import deck' }, 500);
  }

  return c.json(deck, 201);
});

importExportRoutes.post('/import/csv', zValidator('json', importCSVSchema), async (c) => {
  const { title, description, csvData } = c.req.valid('json');
  const user = c.get('user');

  const deck = await ImportExportService.importDeckFromCSV(user.id, title, description, csvData);
  if (!deck) {
    return c.json({ error: 'Failed to import deck' }, 500);
  }

  return c.json(deck, 201);
});

importExportRoutes.get('/export/json/:deckId', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));
  const user = c.get('user');

  const jsonData = await ImportExportService.exportDeckToJSON(deckId, user.id);
  if (!jsonData) {
    return c.json({ error: 'Failed to export deck' }, 404);
  }

  // Set headers for file download
  c.header('Content-Type', 'application/json');
  c.header('Content-Disposition', `attachment; filename="deck-${deckId}.json"`);

  return c.text(jsonData);
});

importExportRoutes.get('/export/csv/:deckId', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));
  const user = c.get('user');

  const csvData = await ImportExportService.exportDeckToCSV(deckId, user.id);
  if (!csvData) {
    return c.json({ error: 'Failed to export deck' }, 404);
  }

  // Set headers for file download
  c.header('Content-Type', 'text/csv');
  c.header('Content-Disposition', `attachment; filename="deck-${deckId}.csv"`);

  return c.text(csvData);
});

export default importExportRoutes; 