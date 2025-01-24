import { Card } from '../models/CardModel';
import { Test } from '../models/TestModel';
import cardModel from '../models/CardModel';
import testModel from '../models/TestModel';
import pool from '../db/config';

export interface StudyStats {
  totalCards: number;
  masteredCards: number;
  cardsToReview: number;
  averageGrade: number;
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
  totalCards: number;
  masteredCards: number;
  dueCards: number;
  lastStudied: Date | null;
  studyHistory: Array<{
    date: Date;
    cardsStudied: number;
    performance: {
      easy: number;
      good: number;
      hard: number;
      again: number;
    };
  }>;
  cardProgress: Array<{
    cardId: number;
    lastGrade: number;
  }>;
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
          COUNT(CASE WHEN last_grade >= 4 THEN 1 END) as mastered_cards,
          COUNT(CASE WHEN last_grade < 4 AND last_grade > 0 THEN 1 END) as cards_to_review,
          AVG(last_grade) as avg_grade
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
      averageGrade: parseFloat(stats.avg_grade) || 0
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
   * Get detailed progress for a specific deck
   */
  static async getDeckDetailedProgress(deckId: number, userId: number): Promise<DeckProgress> {
    // Get basic deck stats and mastery based on recent performance
    const statsQuery = {
      text: `
        WITH card_grades AS (
          SELECT 
            c.id,
            CASE 
              WHEN c.last_grade >= 4 THEN true  -- Easy/Good responses
              ELSE false
            END as is_mastered,
            c.updated_at as last_studied,
            c.last_grade
          FROM cards c
          WHERE c.deck_id = $1
          AND c.deck_id IN (SELECT id FROM decks WHERE user_id = $2)
        )
        SELECT 
          COUNT(*) as total_cards,
          COUNT(CASE WHEN is_mastered THEN 1 END) as mastered_cards,
          COUNT(CASE WHEN last_grade < 4 AND last_grade > 0 THEN 1 END) as due_cards,
          MAX(last_studied) as last_studied
        FROM card_grades
      `,
      values: [deckId, userId]
    };

    // Get study history with performance breakdown
    const historyQuery = {
      text: `
        SELECT 
          DATE(updated_at) as study_date,
          COUNT(*) as cards_studied,
          COUNT(CASE WHEN last_grade = 5 THEN 1 END) as easy_count,
          COUNT(CASE WHEN last_grade = 4 THEN 1 END) as good_count,
          COUNT(CASE WHEN last_grade = 2 THEN 1 END) as hard_count,
          COUNT(CASE WHEN last_grade = 1 THEN 1 END) as again_count
        FROM cards
        WHERE deck_id = $1
        AND deck_id IN (SELECT id FROM decks WHERE user_id = $2)
        AND updated_at IS NOT NULL
        GROUP BY DATE(updated_at)
        ORDER BY study_date DESC
        LIMIT 30
      `,
      values: [deckId, userId]
    };

    // Get card progress including last grade
    const progressQuery = {
      text: `
        SELECT 
          id as card_id,
          last_grade
        FROM cards
        WHERE deck_id = $1
        AND deck_id IN (SELECT id FROM decks WHERE user_id = $2)
      `,
      values: [deckId, userId]
    };

    const [statsResult, historyResult, progressResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(historyQuery),
      pool.query(progressQuery)
    ]);

    const stats = statsResult.rows[0];

    return {
      totalCards: parseInt(stats.total_cards) || 0,
      masteredCards: parseInt(stats.mastered_cards) || 0,
      dueCards: parseInt(stats.due_cards) || 0,
      lastStudied: stats.last_studied,
      studyHistory: historyResult.rows.map(row => ({
        date: row.study_date,
        cardsStudied: parseInt(row.cards_studied),
        performance: {
          easy: parseInt(row.easy_count) || 0,
          good: parseInt(row.good_count) || 0,
          hard: parseInt(row.hard_count) || 0,
          again: parseInt(row.again_count) || 0
        }
      })),
      cardProgress: progressResult.rows.map(row => ({
        cardId: row.card_id,
        lastGrade: parseInt(row.last_grade) || 0
      }))
    };
  }
} 