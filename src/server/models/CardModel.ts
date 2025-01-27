import BaseModel from './BaseModel';
import { PoolClient } from 'pg';
import pool from '../db/config';

export interface Card {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  last_grade: number;  // 0=new, 1=again, 2=hard, 4=good, 5=easy
  updated_at: Date;
  created_at: Date;
}

export interface CreateCardData {
  deck_id: number;
  front: string;
  back: string;
  last_grade?: number;
}

export interface UpdateCardData {
  front?: string;
  back?: string;
  last_grade?: number;
}

export class CardModel extends BaseModel {
  protected tableName = 'cards';
  protected columns = [
    'id',
    'deck_id',
    'front',
    'back',
    'last_grade',
    'updated_at',
    'created_at'
  ];

  // Create a new card
  async createCard(data: CreateCardData): Promise<Card> {
    const cardData = {
      ...data,
      last_grade: data.last_grade || 0  // Default to 0 for new cards
    };
    return this.create(cardData);
  }

  // Update a card
  async updateCard(id: number, deckId: number, data: UpdateCardData): Promise<Card | null> {
    const result = await this.update({ id, deck_id: deckId }, data);
    return result[0] || null;
  }

  // Get card by ID and deck ID
  async getCard(id: number, deckId: number): Promise<Card | null> {
    return this.findOne({ id, deck_id: deckId });
  }

  // Get all cards in a deck with user progress
  async getDeckCards(deckId: number, userId?: number): Promise<Card[]> {
    const query = {
      text: `
        SELECT 
          c.*,
          COALESCE(ucp.last_grade, c.last_grade) as last_grade
        FROM ${this.tableName} c
        LEFT JOIN user_card_progress ucp ON c.id = ucp.card_id AND ucp.user_id = $2
        WHERE c.deck_id = $1
        ORDER BY c.created_at ASC
      `,
      values: [deckId, userId || null]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Delete a card
  async deleteCard(id: number, deckId: number): Promise<Card | null> {
    const result = await this.delete({ id, deck_id: deckId });
    return result[0] || null;
  }

  // Bulk create cards
  async bulkCreateCards(cards: CreateCardData[], client?: PoolClient): Promise<Card[]> {
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    cards.forEach(card => {
      values.push(
        card.deck_id,
        card.front,
        card.back,
        card.last_grade || 0
      );
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
      );
      paramIndex += 4;
    });

    const query = {
      text: `
        INSERT INTO ${this.tableName}
        (deck_id, front, back, last_grade)
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `,
      values
    };

    const queryClient = client || pool;
    const result = await queryClient.query(query);
    return result.rows;
  }

  // Search cards by content
  async searchCards(deckId: number, searchTerm: string, options: { limit?: number; offset?: number } = {}): Promise<Card[]> {
    const query = {
      text: `
        SELECT * FROM ${this.tableName}
        WHERE deck_id = $1
        AND (front ILIKE $2 OR back ILIKE $2)
        ${options.limit ? 'LIMIT $3' : ''}
        ${options.offset ? 'OFFSET $4' : ''}
      `,
      values: [
        deckId,
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
export default new CardModel(); 