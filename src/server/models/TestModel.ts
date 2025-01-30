import { db } from '../db';
import type { QuestionType } from './QuestionModel';
import type { Question } from './QuestionModel';

export interface Test {
  id: number;
  user_id: number;
  deck_id: number;
  title: string;
  description?: string;
  created_at: Date;
  questions?: Question[];
}

export interface TestWithStats extends Test {
  question_count: number;
  completed: boolean;
  score?: number;
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

class TestModel {
  async createTest(data: CreateTestData): Promise<Test | null> {
    try {
      const results = await db.query<Test>(
        `INSERT INTO tests (user_id, deck_id, title, description)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.user_id, data.deck_id, data.title, data.description]
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error creating test:', error);
      return null;
    }
  }

  async getTest(id: number, userId: number): Promise<TestWithStats | null> {
    try {
      // First get the test with stats
      const testResults = await db.query<TestWithStats>(
        `SELECT t.*,
                COUNT(q.id) as question_count,
                EXISTS(
                  SELECT 1 FROM user_answers ua 
                  JOIN questions q2 ON q2.id = ua.question_id 
                  WHERE q2.test_id = t.id AND ua.user_id = $2
                ) as completed,
                CASE 
                  WHEN COUNT(ua.id) > 0 THEN 
                    ROUND(AVG(CASE WHEN ua.is_correct THEN 100 ELSE 0 END))
                  ELSE NULL 
                END as score
         FROM tests t
         LEFT JOIN questions q ON q.test_id = t.id
         LEFT JOIN user_answers ua ON ua.question_id = q.id AND ua.user_id = $2
         WHERE t.id = $1
         GROUP BY t.id, t.user_id, t.deck_id, t.title, t.description, t.created_at`,
        [id, userId]
      );

      if (!testResults[0]) {
        return null;
      }

      // Then get the questions with their options
      const questionsResults = await db.query<Question>(
        `SELECT q.*,
                json_agg(
                  json_build_object(
                    'id', qo.id,
                    'content', qo.content,
                    'is_correct', qo.is_correct,
                    'match_id', qo.match_id
                  )
                ) as options
         FROM questions q
         LEFT JOIN question_options qo ON qo.question_id = q.id
         WHERE q.test_id = $1
         GROUP BY q.id
         ORDER BY q.id`,
        [id]
      );

      // Combine the results
      return {
        ...testResults[0],
        questions: questionsResults
      };
    } catch (error) {
      console.error('Error getting test:', error);
      return null;
    }
  }

  async getUserTests(userId: number): Promise<TestWithStats[]> {
    try {
      const results = await db.query<TestWithStats>(
        `SELECT t.*,
                COUNT(q.id) as question_count,
                EXISTS(
                  SELECT 1 FROM user_answers ua 
                  JOIN questions q2 ON q2.id = ua.question_id 
                  WHERE q2.test_id = t.id AND ua.user_id = $1
                ) as completed,
                CASE 
                  WHEN COUNT(ua.id) > 0 THEN 
                    ROUND(AVG(CASE WHEN ua.is_correct THEN 100 ELSE 0 END))
                  ELSE NULL 
                END as score
         FROM tests t
         LEFT JOIN questions q ON q.test_id = t.id
         LEFT JOIN user_answers ua ON ua.question_id = q.id AND ua.user_id = $1
         WHERE t.user_id = $1
         GROUP BY t.id, t.user_id, t.deck_id, t.title, t.description, t.created_at
         ORDER BY t.created_at DESC`,
        [userId]
      );
      return results;
    } catch (error) {
      console.error('Error getting user tests:', error);
      return [];
    }
  }

  async updateTest(id: number, userId: number, data: UpdateTestData): Promise<Test | null> {
    try {
      const results = await db.query<Test>(
        `UPDATE tests
         SET title = COALESCE($3, title),
             description = COALESCE($4, description)
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId, data.title, data.description]
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error updating test:', error);
      return null;
    }
  }

  async deleteTest(id: number, userId: number): Promise<Test | null> {
    try {
      const results = await db.query<Test>(
        `DELETE FROM tests
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId]
      );
      return results[0] || null;
    } catch (error) {
      console.error('Error deleting test:', error);
      return null;
    }
  }

  async getTestResults(id: number, userId: number): Promise<{
    total_questions: number;
    correct_answers: number;
    score: number;
    answers: Array<{
      question_id: number;
      is_correct: boolean;
      user_answer: string;
      correct_answer: string;
    }>;
  } | null> {
    try {
      const results = await db.query<{
        total_questions: number;
        correct_answers: number;
        score: number;
        answers: Array<{
          question_id: number;
          is_correct: boolean;
          user_answer: string;
          correct_answer: string;
        }>;
      }>(
        `WITH answer_data AS (
        SELECT 
             COUNT(*) as total_questions,
             COUNT(CASE WHEN ua.is_correct THEN 1 END) as correct_answers,
             ROUND(AVG(CASE WHEN ua.is_correct THEN 100 ELSE 0 END)) as score,
             json_agg(json_build_object(
               'question_id', q.id,
               'is_correct', ua.is_correct,
               'user_answer', ua.answer,
               'correct_answer', 
               CASE 
                 WHEN q.type = 'multiple_choice' THEN 
                   (SELECT content FROM question_options WHERE question_id = q.id AND is_correct = true LIMIT 1)
                 WHEN q.type = 'true_false' THEN 
                   CASE WHEN q.correct_answer = 'true' THEN 'True' ELSE 'False' END
                 ELSE q.correct_answer
               END
             )) as answers
        FROM questions q
        LEFT JOIN user_answers ua ON ua.question_id = q.id AND ua.user_id = $2
        WHERE q.test_id = $1
           GROUP BY q.test_id
         )
         SELECT * FROM answer_data`,
        [id, userId]
      );
      
      return results[0] || null;
    } catch (error) {
      console.error('Error getting test results:', error);
      return null;
    }
  }
}

export default new TestModel(); 