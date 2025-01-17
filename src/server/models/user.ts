import { query } from '../db/config';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password_hash: string;
}

export class UserModel {
  static async create(input: CreateUserInput): Promise<User> {
    const { rows } = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [input.username, input.email, input.password_hash]
    );
    return rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async update(id: number, updates: Partial<CreateUserInput>): Promise<User | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    const values = Object.values(updates);

    const { rows } = await query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
} 