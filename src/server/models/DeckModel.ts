import BaseModel from './BaseModel';
import { PoolClient } from 'pg';
import pool from '../db/config';

export interface Deck {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: Date;
}

export interface CreateDeckData {
  user_id: number;
  title: string;
  description?: string;
  is_public?: boolean;
}

export interface UpdateDeckData {
  title?: string;
  description?: string;
  is_public?: boolean;
}

export class DeckModel extends BaseModel {
  protected tableName = 'decks';
  protected columns = ['id', 'user_id', 'title', 'description', 'is_public', 'created_at'];

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
    // First try to find a deck owned by the user
    const userDeck = await this.findOne({ id, user_id: userId });
    if (userDeck) return userDeck;

    // If not found, check if it's a public deck
    const query = {
      text: `
        SELECT * FROM ${this.tableName}
        WHERE id = $1 AND is_public = true
      `,
      values: [id]
    };
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  // Get all decks for a user
  async getUserDecks(userId: number, options: { orderBy?: string; limit?: number; offset?: number } = {}): Promise<Deck[]> {
    return this.find({ user_id: userId }, options);
  }

  // Get all public decks
  async getPublicDecks(options: { orderBy?: string; limit?: number; offset?: number } = {}): Promise<Deck[]> {
    const query = {
      text: `
        SELECT d.*, u.username as creator_name
        FROM ${this.tableName} d
        JOIN users u ON d.user_id = u.id
        WHERE d.is_public = true
        ${options.orderBy ? `ORDER BY ${options.orderBy}` : 'ORDER BY d.created_at DESC'}
        ${options.limit ? 'LIMIT $1' : ''}
        ${options.offset ? 'OFFSET $2' : ''}
      `,
      values: [
        ...(options.limit ? [options.limit] : []),
        ...(options.offset ? [options.offset] : [])
      ]
    };

    const result = await pool.query(query);
    return result.rows;
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
          COUNT(DISTINCT c.id) as total_cards,
          COUNT(DISTINCT CASE WHEN ucp.last_grade < 4 AND ucp.last_grade > 0 THEN c.id END) as due_cards,
          COUNT(DISTINCT CASE WHEN ucp.last_grade >= 4 THEN c.id END) as mastered_cards
        FROM cards c
        LEFT JOIN user_card_progress ucp ON c.id = ucp.card_id AND ucp.user_id = $2
        WHERE c.deck_id = $1
      `,
      values: [id, userId]
    };

    const queryClient = client || pool;
    const result = await queryClient.query(query);
    return {
      totalCards: parseInt(result.rows[0].total_cards),
      dueCards: parseInt(result.rows[0].due_cards) || 0,
      masteredCards: parseInt(result.rows[0].mastered_cards) || 0
    };
  }

  // Search decks by title
  async searchDecks(userId: number, searchTerm: string, options: { includePublic?: boolean; limit?: number; offset?: number } = {}): Promise<Deck[]> {
    const query = {
      text: `
        SELECT d.*, u.username as creator_name
        FROM ${this.tableName} d
        JOIN users u ON d.user_id = u.id
        WHERE (d.user_id = $1 OR (d.is_public = true AND $2 = true))
        AND (d.title ILIKE $3 OR d.description ILIKE $3)
        ORDER BY d.created_at DESC
        ${options.limit ? 'LIMIT $4' : ''}
        ${options.offset ? 'OFFSET $5' : ''}
      `,
      values: [
        userId,
        options.includePublic ?? true,
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