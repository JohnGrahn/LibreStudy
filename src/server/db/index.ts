import pool from './config';

export const db = {
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await pool.query(text, params);
    return result.rows;
  }
};

export default db; 