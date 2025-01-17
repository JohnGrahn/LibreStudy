import { query } from '../db/config';

export interface Deck {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  created_at: Date;
}

export interface CreateDeckInput {
  user_id: number;
  title: string;
  description?: string;
}

export class DeckModel {
  static async create(input: CreateDeckInput): Promise<Deck> {
    const { rows } = await query(
      'INSERT INTO decks (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
      [input.user_id, input.title, input.description || null]
    );
    return rows[0];
  }

  static async findById(id: number): Promise<Deck | null> {
    const { rows } = await query('SELECT * FROM decks WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId: number): Promise<Deck[]> {
    const { rows } = await query('SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows;
  }

  static async update(id: number, updates: Partial<CreateDeckInput>): Promise<Deck | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = Object.values(updates);

    const { rows } = await query(
      `UPDATE decks SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM decks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async search(userId: number, searchQuery: string): Promise<Deck[]> {
    const searchPattern = `%${searchQuery}%`;
    const { rows } = await query(
      'SELECT * FROM decks WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2) ORDER BY created_at DESC',
      [userId, searchPattern]
    );
    return rows;
  }
} 