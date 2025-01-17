import { query, transaction } from '../db/config';

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
  is_correct: boolean | null;
  match_id: number | null;
  created_at: Date;
}

export interface CreateQuestionInput {
  test_id: number;
  card_id: number;
  type: QuestionType;
  content: string;
  options?: Array<{
    content: string;
    is_correct?: boolean;
    match_id?: number;
  }>;
}

type UpdateQuestionInput = Partial<Omit<CreateQuestionInput, 'options'>>;

export class QuestionModel {
  static async create(input: CreateQuestionInput): Promise<Question> {
    return transaction(async (client) => {
      // Create question
      const { rows: [question] } = await client.query(
        'INSERT INTO questions (test_id, card_id, type, content) VALUES ($1, $2, $3, $4) RETURNING *',
        [input.test_id, input.card_id, input.type, input.content]
      );

      // Create options if provided
      if (input.options && input.options.length > 0) {
        const placeholders = input.options.map((_, index) => {
          const offset = index * 3;
          return `($1, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
        }).join(', ');

        const values: Array<string | number | boolean | null> = [question.id];
        input.options.forEach(option => {
          values.push(
            option.content,
            option.is_correct === undefined ? null : option.is_correct,
            option.match_id || null
          );
        });

        await client.query(
          `INSERT INTO question_options (question_id, content, is_correct, match_id) VALUES ${placeholders}`,
          values
        );
      }

      return question;
    });
  }

  static async findById(id: number): Promise<Question | null> {
    const { rows } = await query('SELECT * FROM questions WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async findByTestId(testId: number): Promise<Question[]> {
    const { rows } = await query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY created_at',
      [testId]
    );
    return rows;
  }

  static async getOptions(questionId: number): Promise<QuestionOption[]> {
    const { rows } = await query(
      'SELECT * FROM question_options WHERE question_id = $1 ORDER BY id',
      [questionId]
    );
    return rows;
  }

  static async update(id: number, updates: UpdateQuestionInput): Promise<Question | null> {
    if (Object.keys(updates).length === 0) {
      return this.findById(id);
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values: Array<string | number | QuestionType> = [id];
    Object.values(updates).forEach(value => {
      values.push(value);
    });

    const { rows } = await query(
      `UPDATE questions SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM questions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async updateOptions(questionId: number, options: Array<{
    id?: number;
    content: string;
    is_correct?: boolean;
    match_id?: number;
  }>): Promise<QuestionOption[]> {
    return transaction(async (client) => {
      // Delete existing options
      await client.query('DELETE FROM question_options WHERE question_id = $1', [questionId]);

      // Insert new options
      if (options.length > 0) {
        const placeholders = options.map((_, index) => {
          const offset = index * 3;
          return `($1, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
        }).join(', ');

        const values: Array<string | number | boolean | null> = [questionId];
        options.forEach(option => {
          values.push(
            option.content,
            option.is_correct === undefined ? null : option.is_correct,
            option.match_id || null
          );
        });

        const { rows } = await client.query(
          `INSERT INTO question_options (question_id, content, is_correct, match_id) 
           VALUES ${placeholders}
           RETURNING *`,
          values
        );

        return rows;
      }

      return [];
    });
  }
} 