import BaseModel from './BaseModel';
import { PoolClient } from 'pg';
import pool from '../db/config';

export interface Test {
  id: number;
  user_id: number;
  deck_id: number;
  title: string;
  description: string | null;
  created_at: Date;
}

export interface CreateTestData {
  user_id: number;
  deck_id: number;
  title: string;
  description?: string;
}

export interface UpdateTestData {
  title?: string;
  description?: string;
}

export interface TestWithStats extends Test {
  total_questions: number;
  correct_answers: number;
  completion_rate: number;
}

export class TestModel extends BaseModel {
  protected tableName = 'tests';
  protected columns = ['id', 'user_id', 'deck_id', 'title', 'description', 'created_at'];

  // Create a new test
  async createTest(data: CreateTestData): Promise<Test> {
    return this.create(data);
  }

  // Update a test
  async updateTest(id: number, userId: number, data: UpdateTestData): Promise<Test | null> {
    const result = await this.update({ id, user_id: userId }, data);
    return result[0] || null;
  }

  // Get test by ID and user ID
  async getTest(id: number, userId: number): Promise<Test | null> {
    return this.findOne({ id, user_id: userId });
  }

  // Get all tests for a user
  async getUserTests(userId: number, options: { orderBy?: string; limit?: number; offset?: number } = {}): Promise<Test[]> {
    return this.find({ user_id: userId }, options);
  }

  // Get all tests for a deck
  async getDeckTests(deckId: number, userId: number, options: { orderBy?: string; limit?: number; offset?: number } = {}): Promise<Test[]> {
    return this.find({ deck_id: deckId, user_id: userId }, options);
  }

  // Delete a test
  async deleteTest(id: number, userId: number): Promise<Test | null> {
    const result = await this.delete({ id, user_id: userId });
    return result[0] || null;
  }

  // Get test with statistics
  async getTestWithStats(id: number, userId: number): Promise<TestWithStats | null> {
    const query = {
      text: `
        SELECT 
          t.*,
          COUNT(DISTINCT q.id) as total_questions,
          COUNT(DISTINCT CASE WHEN ua.is_correct THEN ua.question_id END) as correct_answers,
          COALESCE(
            COUNT(DISTINCT CASE WHEN ua.is_correct THEN ua.question_id END)::float / 
            NULLIF(COUNT(DISTINCT q.id), 0),
            0
          ) as completion_rate
        FROM ${this.tableName} t
        LEFT JOIN questions q ON q.test_id = t.id
        LEFT JOIN user_answers ua ON ua.question_id = q.id AND ua.user_id = t.user_id
        WHERE t.id = $1 AND t.user_id = $2
        GROUP BY t.id
      `,
      values: [id, userId]
    };

    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  // Get test results summary
  async getTestResults(id: number, userId: number): Promise<{
    questionId: number;
    content: string;
    type: string;
    userAnswer: string;
    isCorrect: boolean;
  }[]> {
    const query = {
      text: `
        SELECT 
          q.id as question_id,
          q.content,
          q.type,
          ua.answer as user_answer,
          ua.is_correct
        FROM questions q
        LEFT JOIN user_answers ua ON ua.question_id = q.id
        WHERE q.test_id = $1
        AND ua.user_id = $2
        ORDER BY q.id
      `,
      values: [id, userId]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Get test completion status
  async getTestCompletion(id: number, userId: number): Promise<{
    totalQuestions: number;
    answeredQuestions: number;
    isComplete: boolean;
  }> {
    const query = {
      text: `
        SELECT 
          COUNT(DISTINCT q.id) as total_questions,
          COUNT(DISTINCT ua.question_id) as answered_questions
        FROM questions q
        LEFT JOIN user_answers ua ON ua.question_id = q.id AND ua.user_id = $2
        WHERE q.test_id = $1
      `,
      values: [id, userId]
    };

    const result = await pool.query(query);
    const { total_questions, answered_questions } = result.rows[0];
    
    return {
      totalQuestions: parseInt(total_questions),
      answeredQuestions: parseInt(answered_questions),
      isComplete: parseInt(total_questions) === parseInt(answered_questions)
    };
  }
}

// Export a singleton instance
export default new TestModel(); 