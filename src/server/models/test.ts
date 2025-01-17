import { query } from '../db/config';

export interface Test {
  id: number;
  user_id: number;
  deck_id: number;
  title: string;
  description: string | null;
  created_at: Date;
}

export interface CreateTestInput {
  user_id: number;
  deck_id: number;
  title: string;
  description?: string;
}

export class TestModel {
  static async create(input: CreateTestInput): Promise<Test> {
    const { rows } = await query(
      'INSERT INTO tests (user_id, deck_id, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [input.user_id, input.deck_id, input.title, input.description || null]
    );
    return rows[0];
  }

  static async findById(id: number): Promise<Test | null> {
    const { rows } = await query('SELECT * FROM tests WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId: number): Promise<Test[]> {
    const { rows } = await query(
      'SELECT * FROM tests WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  static async findByDeckId(deckId: number): Promise<Test[]> {
    const { rows } = await query(
      'SELECT * FROM tests WHERE deck_id = $1 ORDER BY created_at DESC',
      [deckId]
    );
    return rows;
  }

  static async update(id: number, updates: Partial<CreateTestInput>): Promise<Test | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = Object.values(updates);

    const { rows } = await query(
      `UPDATE tests SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM tests WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
} 