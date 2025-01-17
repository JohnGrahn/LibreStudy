import BaseModel from './BaseModel';
import { PoolClient } from 'pg';
import pool from '../db/config';

export type QuestionType = 'multiple_choice' | 'matching' | 'fill_in_the_blank' | 'true_false';

export interface Question {
  id: number;
  test_id: number;
  card_id: number;
  type: QuestionType;
  content: string;
  created_at: Date;
}

export interface QuestionOption {
  id: number;
  question_id: number;
  content: string;
  is_correct: boolean;
  match_id: number | null;
  created_at: Date;
}

export interface CreateQuestionData {
  test_id: number;
  card_id: number;
  type: QuestionType;
  content: string;
  options?: {
    content: string;
    is_correct?: boolean;
    match_id?: number;
  }[];
}

export interface UpdateQuestionData {
  content?: string;
  type?: QuestionType;
}

export interface QuestionWithOptions extends Question {
  options: QuestionOption[];
}

export class QuestionModel extends BaseModel {
  protected tableName = 'questions';
  protected columns = ['id', 'test_id', 'card_id', 'type', 'content', 'created_at'];

  // Create a new question with options
  async createQuestion(data: CreateQuestionData, client?: PoolClient): Promise<QuestionWithOptions> {
    const queryClient = client || pool;

    return this.transaction(async (transactionClient) => {
      // Create question
      const question = await this.create({
        test_id: data.test_id,
        card_id: data.card_id,
        type: data.type,
        content: data.content
      }, { client: transactionClient });

      // Create options if provided
      let options: QuestionOption[] = [];
      if (data.options && data.options.length > 0) {
        const optionValues: any[] = [];
        const placeholders: string[] = [];
        let paramIndex = 1;

        data.options.forEach(option => {
          optionValues.push(
            question.id,
            option.content,
            option.is_correct || false,
            option.match_id || null
          );
          placeholders.push(
            `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
          );
          paramIndex += 4;
        });

        const optionsQuery = {
          text: `
            INSERT INTO question_options
            (question_id, content, is_correct, match_id)
            VALUES ${placeholders.join(', ')}
            RETURNING *
          `,
          values: optionValues
        };

        const optionsResult = await transactionClient.query(optionsQuery);
        options = optionsResult.rows;
      }

      return {
        ...question,
        options
      };
    });
  }

  // Update a question
  async updateQuestion(id: number, testId: number, data: UpdateQuestionData): Promise<Question | null> {
    const result = await this.update({ id, test_id: testId }, data);
    return result[0] || null;
  }

  // Get question by ID with options
  async getQuestion(id: number, testId: number): Promise<QuestionWithOptions | null> {
    const query = {
      text: `
        SELECT 
          q.*,
          json_agg(
            json_build_object(
              'id', qo.id,
              'question_id', qo.question_id,
              'content', qo.content,
              'is_correct', qo.is_correct,
              'match_id', qo.match_id,
              'created_at', qo.created_at
            )
          ) as options
        FROM ${this.tableName} q
        LEFT JOIN question_options qo ON qo.question_id = q.id
        WHERE q.id = $1 AND q.test_id = $2
        GROUP BY q.id
      `,
      values: [id, testId]
    };

    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  // Get all questions for a test with options
  async getTestQuestions(testId: number): Promise<QuestionWithOptions[]> {
    const query = {
      text: `
        SELECT 
          q.*,
          json_agg(
            json_build_object(
              'id', qo.id,
              'question_id', qo.question_id,
              'content', qo.content,
              'is_correct', qo.is_correct,
              'match_id', qo.match_id,
              'created_at', qo.created_at
            )
          ) as options
        FROM ${this.tableName} q
        LEFT JOIN question_options qo ON qo.question_id = q.id
        WHERE q.test_id = $1
        GROUP BY q.id
        ORDER BY q.id
      `,
      values: [testId]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Delete a question and its options
  async deleteQuestion(id: number, testId: number): Promise<Question | null> {
    return this.transaction(async (client) => {
      // Delete options first (cascade will handle this, but being explicit)
      await client.query('DELETE FROM question_options WHERE question_id = $1', [id]);
      
      // Delete question
      const result = await this.delete({ id, test_id: testId }, { client });
      return result[0] || null;
    });
  }

  // Update question options
  async updateQuestionOptions(
    questionId: number,
    options: { id?: number; content: string; is_correct?: boolean; match_id?: number }[]
  ): Promise<QuestionOption[]> {
    return this.transaction(async (client) => {
      // Delete existing options
      await client.query('DELETE FROM question_options WHERE question_id = $1', [questionId]);

      // Insert new options
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      options.forEach(option => {
        values.push(
          questionId,
          option.content,
          option.is_correct || false,
          option.match_id || null
        );
        placeholders.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
        );
        paramIndex += 4;
      });

      const query = {
        text: `
          INSERT INTO question_options
          (question_id, content, is_correct, match_id)
          VALUES ${placeholders.join(', ')}
          RETURNING *
        `,
        values
      };

      const result = await client.query(query);
      return result.rows;
    });
  }
}

// Export a singleton instance
export default new QuestionModel(); 