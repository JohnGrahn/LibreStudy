import { Card } from '../models/CardModel';
import { Test } from '../models/TestModel';
import cardModel from '../models/CardModel';
import testModel from '../models/TestModel';
import pool from '../db/config';

export interface StudyStats {
  totalCards: number;
  masteredCards: number;
  cardsToReview: number;
  averageEaseFactor: number;
  averageInterval: number;
}

export interface TestStats {
  totalTests: number;
  averageScore: number;
  testsByType: {
    [key: string]: number;
  };
  recentScores: {
    testId: number;
    score: number;
    date: Date;
  }[];
}

export interface DeckProgress {
  deckId: number;
  totalCards: number;
  masteredCards: number;
  dueCards: number;
  lastStudied: Date | null;
}

export class ProgressTrackingService {
  /**
   * Get study statistics for a user
   */
  static async getStudyStats(userId: number): Promise<StudyStats> {
    const query = {
      text: `
        SELECT 
          COUNT(*) as total_cards,
          COUNT(CASE WHEN interval >= 30 THEN 1 END) as mastered_cards,
          COUNT(CASE WHEN due_date <= NOW() THEN 1 END) as cards_to_review,
          AVG(ease_factor) as avg_ease_factor,
          AVG(interval) as avg_interval
        FROM cards c
        JOIN decks d ON c.deck_id = d.id
        WHERE d.user_id = $1
      `,
      values: [userId]
    };

    const result = await pool.query(query);
    const stats = result.rows[0];

    return {
      totalCards: parseInt(stats.total_cards),
      masteredCards: parseInt(stats.mastered_cards),
      cardsToReview: parseInt(stats.cards_to_review),
      averageEaseFactor: parseFloat(stats.avg_ease_factor) || 2.5,
      averageInterval: parseFloat(stats.avg_interval) || 0
    };
  }

  /**
   * Get test statistics for a user
   */
  static async getTestStats(userId: number): Promise<TestStats> {
    const query = {
      text: `
        WITH test_scores AS (
          SELECT 
            t.id as test_id,
            t.created_at as test_date,
            COUNT(DISTINCT q.id) as total_questions,
            COUNT(DISTINCT CASE WHEN ua.is_correct THEN ua.question_id END) as correct_answers,
            q.type as question_type
          FROM tests t
          JOIN questions q ON q.test_id = t.id
          LEFT JOIN user_answers ua ON ua.question_id = q.id AND ua.user_id = t.user_id
          WHERE t.user_id = $1
          GROUP BY t.id, t.created_at, q.type
        )
        SELECT 
          COUNT(DISTINCT test_id) as total_tests,
          AVG(CAST(correct_answers AS FLOAT) / NULLIF(total_questions, 0)) as avg_score,
          json_object_agg(
            question_type,
            COUNT(DISTINCT test_id)
          ) as tests_by_type,
          json_agg(
            json_build_object(
              'testId', test_id,
              'score', CAST(correct_answers AS FLOAT) / total_questions,
              'date', test_date
            )
            ORDER BY test_date DESC
            LIMIT 5
          ) as recent_scores
        FROM test_scores
      `,
      values: [userId]
    };

    const result = await pool.query(query);
    const stats = result.rows[0];

    return {
      totalTests: parseInt(stats.total_tests),
      averageScore: parseFloat(stats.avg_score) || 0,
      testsByType: stats.tests_by_type || {},
      recentScores: stats.recent_scores || []
    };
  }

  /**
   * Get progress for all decks of a user
   */
  static async getDeckProgress(userId: number): Promise<DeckProgress[]> {
    const query = {
      text: `
        SELECT 
          d.id as deck_id,
          COUNT(c.*) as total_cards,
          COUNT(CASE WHEN c.interval >= 30 THEN 1 END) as mastered_cards,
          COUNT(CASE WHEN c.due_date <= NOW() THEN 1 END) as due_cards,
          MAX(c.due_date) as last_studied
        FROM decks d
        LEFT JOIN cards c ON c.deck_id = d.id
        WHERE d.user_id = $1
        GROUP BY d.id
      `,
      values: [userId]
    };

    const result = await pool.query(query);
    
    return result.rows.map(row => ({
      deckId: row.deck_id,
      totalCards: parseInt(row.total_cards),
      masteredCards: parseInt(row.mastered_cards),
      dueCards: parseInt(row.due_cards),
      lastStudied: row.last_studied
    }));
  }

  /**
   * Get detailed progress for a specific deck
   */
  static async getDeckDetailedProgress(deckId: number, userId: number): Promise<{
    studyHistory: { date: Date; cardsStudied: number }[];
    cardProgress: { cardId: number; interval: number; easeFactor: number }[];
  }> {
    const historyQuery = {
      text: `
        SELECT 
          DATE(due_date) as study_date,
          COUNT(*) as cards_studied
        FROM cards
        WHERE deck_id = $1
        AND deck_id IN (SELECT id FROM decks WHERE user_id = $2)
        GROUP BY DATE(due_date)
        ORDER BY study_date DESC
        LIMIT 30
      `,
      values: [deckId, userId]
    };

    const progressQuery = {
      text: `
        SELECT 
          id as card_id,
          interval,
          ease_factor
        FROM cards
        WHERE deck_id = $1
        AND deck_id IN (SELECT id FROM decks WHERE user_id = $2)
      `,
      values: [deckId, userId]
    };

    const [historyResult, progressResult] = await Promise.all([
      pool.query(historyQuery),
      pool.query(progressQuery)
    ]);

    return {
      studyHistory: historyResult.rows.map(row => ({
        date: row.study_date,
        cardsStudied: parseInt(row.cards_studied)
      })),
      cardProgress: progressResult.rows.map(row => ({
        cardId: row.card_id,
        interval: parseInt(row.interval),
        easeFactor: parseFloat(row.ease_factor)
      }))
    };
  }
} 