import BaseModel from './BaseModel';
import pool from '../db/config';

export interface UserCardProgress {
  id: number;
  user_id: number;
  card_id: number;
  last_grade: number;
  updated_at: Date;
  created_at: Date;
}

export interface CreateUserCardProgressData {
  user_id: number;
  card_id: number;
  last_grade: number;
}

export interface UpdateUserCardProgressData {
  last_grade: number;
}

export class UserCardProgressModel extends BaseModel {
  protected tableName = 'user_card_progress';
  protected columns = ['id', 'user_id', 'card_id', 'last_grade', 'updated_at', 'created_at'];

  // Create or update user progress on a card
  async updateProgress(userId: number, cardId: number, lastGrade: number): Promise<UserCardProgress> {
    const query = {
      text: `
        INSERT INTO ${this.tableName} (user_id, card_id, last_grade)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, card_id)
        DO UPDATE SET last_grade = $3, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `,
      values: [userId, cardId, lastGrade]
    };

    const result = await pool.query(query);
    return result.rows[0];
  }

  // Get user's progress on a specific card
  async getProgress(userId: number, cardId: number): Promise<UserCardProgress | null> {
    return this.findOne({ user_id: userId, card_id: cardId });
  }

  // Get user's progress on all cards in a deck
  async getDeckProgress(userId: number, deckId: number): Promise<UserCardProgress[]> {
    const query = {
      text: `
        SELECT ucp.*
        FROM ${this.tableName} ucp
        JOIN cards c ON ucp.card_id = c.id
        WHERE ucp.user_id = $1 AND c.deck_id = $2
      `,
      values: [userId, deckId]
    };

    const result = await pool.query(query);
    return result.rows;
  }
}

// Export a singleton instance
export default new UserCardProgressModel(); 