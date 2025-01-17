import { serve } from "bun";
import api from './api';

const port = parseInt(process.env.PORT || '3001');

console.log(`Server starting on port ${port}...`);

export default {
  port,
  fetch: api.fetch
}; 