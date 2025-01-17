import { query } from '../db/config';

export interface UserAnswer {
  id: number;
  user_id: number;
  question_id: number;
  answer: string;
  is_correct: boolean;
  timestamp: Date;
}

export interface CreateUserAnswerInput {
  user_id: number;
  question_id: number;
  answer: string;
  is_correct: boolean;
}

export class UserAnswerModel {
  static async create(input: CreateUserAnswerInput): Promise<UserAnswer> {
    const { rows } = await query(
      'INSERT INTO user_answers (user_id, question_id, answer, is_correct) VALUES ($1, $2, $3, $4) RETURNING *',
      [input.user_id, input.question_id, input.answer, input.is_correct]
    );
    return rows[0];
  }

  static async findByQuestionId(questionId: number): Promise<UserAnswer[]> {
    const { rows } = await query(
      'SELECT * FROM user_answers WHERE question_id = $1 ORDER BY timestamp DESC',
      [questionId]
    );
    return rows;
  }

  static async findByUserId(userId: number): Promise<UserAnswer[]> {
    const { rows } = await query(
      'SELECT * FROM user_answers WHERE user_id = $1 ORDER BY timestamp DESC',
      [userId]
    );
    return rows;
  }

  static async getUserTestResults(userId: number, testId: number): Promise<{
    total: number;
    correct: number;
    answers: UserAnswer[];
  }> {
    const { rows } = await query(
      `SELECT ua.* 
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       WHERE ua.user_id = $1 AND q.test_id = $2
       ORDER BY ua.timestamp`,
      [userId, testId]
    );

    const correct = rows.filter((row: UserAnswer) => row.is_correct).length;

    return {
      total: rows.length,
      correct,
      answers: rows
    };
  }

  static async getUserPerformanceStats(userId: number): Promise<{
    totalAnswers: number;
    correctAnswers: number;
    averageScore: number;
    testsTaken: number;
  }> {
    const { rows: [stats] } = await query(
      `WITH test_stats AS (
         SELECT DISTINCT ua.user_id, q.test_id
         FROM user_answers ua
         JOIN questions q ON ua.question_id = q.id
         WHERE ua.user_id = $1
       )
       SELECT 
         COUNT(ua.*) as total_answers,
         COUNT(ua.*) FILTER (WHERE ua.is_correct) as correct_answers,
         COUNT(DISTINCT ts.test_id) as tests_taken
       FROM user_answers ua
       LEFT JOIN questions q ON ua.question_id = q.id
       LEFT JOIN test_stats ts ON ts.user_id = ua.user_id
       WHERE ua.user_id = $1`,
      [userId]
    );

    return {
      totalAnswers: parseInt(stats.total_answers),
      correctAnswers: parseInt(stats.correct_answers),
      averageScore: stats.total_answers > 0 
        ? (parseInt(stats.correct_answers) / parseInt(stats.total_answers)) * 100 
        : 0,
      testsTaken: parseInt(stats.tests_taken)
    };
  }
} 