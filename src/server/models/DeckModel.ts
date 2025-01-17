import BaseModel from './BaseModel';
import { PoolClient } from 'pg';
import pool from '../db/config';

export interface Deck {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  created_at: Date;
}

export interface CreateDeckData {
  user_id: number;
  title: string;
  description?: string;
}

export interface UpdateDeckData {
  title?: string;
  description?: string;
}

export class DeckModel extends BaseModel {
  protected tableName = 'decks';
  protected columns = ['id', 'user_id', 'title', 'description', 'created_at'];

  // Create a new deck
  async createDeck(data: CreateDeckData): Promise<Deck> {
    return this.create(data);
  }

  // Update a deck
  async updateDeck(id: number, userId: number, data: UpdateDeckData): Promise<Deck | null> {
    const result = await this.update({ id, user_id: userId }, data);
    return result[0] || null;
  }

  // Get deck by ID and user ID
  async getDeck(id: number, userId: number): Promise<Deck | null> {
    return this.findOne({ id, user_id: userId });
  }

  // Get all decks for a user
  async getUserDecks(userId: number, options: { orderBy?: string; limit?: number; offset?: number } = {}): Promise<Deck[]> {
    return this.find({ user_id: userId }, options);
  }

  // Delete a deck
  async deleteDeck(id: number, userId: number): Promise<Deck | null> {
    const result = await this.delete({ id, user_id: userId });
    return result[0] || null;
  }

  // Get deck statistics
  async getDeckStats(id: number, userId: number, client?: PoolClient): Promise<{
    totalCards: number;
    dueCards: number;
    masteredCards: number;
  }> {
    const query = {
      text: `
        SELECT 
          COUNT(*) as total_cards,
          COUNT(CASE WHEN due_date <= NOW() THEN 1 END) as due_cards,
          COUNT(CASE WHEN interval >= 30 THEN 1 END) as mastered_cards
        FROM cards
        WHERE deck_id = $1
        AND deck_id IN (SELECT id FROM decks WHERE user_id = $2)
      `,
      values: [id, userId]
    };

    const queryClient = client || pool;
    const result = await queryClient.query(query);
    return {
      totalCards: parseInt(result.rows[0].total_cards),
      dueCards: parseInt(result.rows[0].due_cards),
      masteredCards: parseInt(result.rows[0].mastered_cards)
    };
  }

  // Search decks by title
  async searchDecks(userId: number, searchTerm: string, options: { limit?: number; offset?: number } = {}): Promise<Deck[]> {
    const query = {
      text: `
        SELECT * FROM ${this.tableName}
        WHERE user_id = $1
        AND (title ILIKE $2 OR description ILIKE $2)
        ${options.limit ? 'LIMIT $3' : ''}
        ${options.offset ? 'OFFSET $4' : ''}
      `,
      values: [
        userId,
        `%${searchTerm}%`,
        ...(options.limit ? [options.limit] : []),
        ...(options.offset ? [options.offset] : [])
      ]
    };

    const result = await pool.query(query);
    return result.rows;
  }
}

// Export a singleton instance
export default new DeckModel(); 