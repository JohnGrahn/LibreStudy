import BaseModel, { QueryOptions } from './BaseModel';
import { createHash } from 'crypto';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
}

export class UserModel extends BaseModel {
  protected tableName = 'users';
  protected columns = ['id', 'username', 'email', 'password_hash', 'created_at'];

  // Hash password using SHA-256
  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    const results = await this.find({ id });
    return results[0] || null;
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    const results = await this.find({ username });
    return results[0] || null;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const results = await this.find({ email });
    return results[0] || null;
  }

  // Create a new user
  async createUser(data: CreateUserData): Promise<User> {
    const userData = {
      username: data.username,
      email: data.email,
      password_hash: this.hashPassword(data.password)
    };
    const results = await this.create(userData);
    return results[0];
  }

  // Update a user
  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const updateData: Record<string, any> = {};
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password_hash = this.hashPassword(data.password);
    
    const results = await super.update({ id }, updateData);
    return results[0];
  }

  // Delete a user
  async deleteUser(id: number): Promise<void> {
    await super.delete({ id });
  }
}

// Export a singleton instance
export default new UserModel(); 