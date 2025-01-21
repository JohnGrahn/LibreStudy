import pool, { getClient } from '../db/config';
import { PoolClient } from 'pg';

export interface QueryOptions {
  client?: PoolClient;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export default abstract class BaseModel {
  protected abstract tableName: string;
  protected abstract columns: string[];

  // Helper method to build WHERE clause
  protected buildWhereClause(conditions: Record<string, any>, startIndex: number = 1): { text: string; values: any[] } {
    const values: any[] = [];
    const clauses: string[] = [];

    Object.entries(conditions).forEach(([key, value], index) => {
      if (value !== undefined) {
        values.push(value);
        clauses.push(`${key} = $${startIndex + values.length - 1}`);
      }
    });

    return {
      text: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '',
      values
    };
  }

  // Helper method to build SET clause for updates
  protected buildSetClause(data: Record<string, any>, startIndex: number = 1): { text: string; values: any[] } {
    const values: any[] = [];
    const sets: string[] = [];

    Object.entries(data).forEach(([key, value], index) => {
      if (value !== undefined) {
        values.push(value);
        sets.push(`${key} = $${startIndex + values.length - 1}`);
      }
    });

    return {
      text: sets.join(', '),
      values
    };
  }

  // Find records by conditions
  async find(conditions: Record<string, any>, options: QueryOptions = {}): Promise<any[]> {
    const where = this.buildWhereClause(conditions);
    const query = {
      text: `SELECT * FROM ${this.tableName}${where.text}` +
        (options.orderBy ? ` ORDER BY ${options.orderBy}` : '') +
        (options.limit ? ` LIMIT ${options.limit}` : '') +
        (options.offset ? ` OFFSET ${options.offset}` : ''),
      values: where.values
    };

    const client = options.client || pool;
    const result = await client.query(query);
    return result.rows;
  }

  // Find a single record by conditions
  async findOne(conditions: Record<string, any>, options: QueryOptions = {}): Promise<any | null> {
    const results = await this.find(conditions, { ...options, limit: 1 });
    return results[0] || null;
  }

  // Create a new record
  async create(data: Record<string, any>, options: QueryOptions = {}): Promise<any> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const query = {
      text: `
        INSERT INTO ${this.tableName} (${keys.join(', ')})
        VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING *
      `,
      values
    };

    const client = options.client || pool;
    const result = await client.query(query);
    return result.rows[0];
  }

  // Update records by conditions
  async update(conditions: Record<string, any>, data: Record<string, any>, options: QueryOptions = {}): Promise<any[]> {
    const set = this.buildSetClause(data, 1);
    const where = this.buildWhereClause(conditions, set.values.length + 1);
    const query = {
      text: `
        UPDATE ${this.tableName}
        SET ${set.text}${where.text}
        RETURNING *
      `,
      values: [...set.values, ...where.values]
    };

    const client = options.client || pool;
    const result = await client.query(query);
    return result.rows;
  }

  // Delete records by conditions
  async delete(conditions: Record<string, any>, options: QueryOptions = {}): Promise<any[]> {
    const where = this.buildWhereClause(conditions);
    const query = {
      text: `DELETE FROM ${this.tableName}${where.text} RETURNING *`,
      values: where.values
    };

    const client = options.client || pool;
    const result = await client.query(query);
    return result.rows;
  }

  // Execute a transaction
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} 