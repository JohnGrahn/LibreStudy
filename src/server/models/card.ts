import { query } from '../db/config';

export interface Card {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  interval: number | null;
  ease_factor: number | null;
  due_date: Date | null;
  created_at: Date;
}

export interface CreateCardInput {
  deck_id: number;
  front: string;
  back: string;
  interval?: number;
  ease_factor?: number;
  due_date?: Date;
}

export class CardModel {
  static async create(input: CreateCardInput): Promise<Card> {
    const { rows } = await query(
      `INSERT INTO cards (deck_id, front, back, interval, ease_factor, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        input.deck_id,
        input.front,
        input.back,
        input.interval || null,
        input.ease_factor || null,
        input.due_date || null,
      ]
    );
    return rows[0];
  }

  static async findById(id: number): Promise<Card | null> {
    const { rows } = await query('SELECT * FROM cards WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByDeckId(deckId: number): Promise<Card[]> {
    const { rows } = await query('SELECT * FROM cards WHERE deck_id = $1 ORDER BY created_at', [deckId]);
    return rows;
  }

  static async update(id: number, updates: Partial<CreateCardInput>): Promise<Card | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = Object.values(updates);

    const { rows } = await query(
      `UPDATE cards SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM cards WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getDueCards(deckId: number, limit: number = 10): Promise<Card[]> {
    const { rows } = await query(
      `SELECT * FROM cards 
       WHERE deck_id = $1 
       AND (due_date IS NULL OR due_date <= CURRENT_TIMESTAMP)
       ORDER BY due_date NULLS FIRST, created_at
       LIMIT $2`,
      [deckId, limit]
    );
    return rows;
  }

  static async updateSpacedRepetition(
    id: number,
    interval: number,
    easeFactor: number,
    dueDate: Date
  ): Promise<Card | null> {
    const { rows } = await query(
      `UPDATE cards 
       SET interval = $2, ease_factor = $3, due_date = $4
       WHERE id = $1 
       RETURNING *`,
      [id, interval, easeFactor, dueDate]
    );
    return rows[0] || null;
  }
} 