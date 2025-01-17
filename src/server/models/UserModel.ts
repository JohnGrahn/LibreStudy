import BaseModel from './BaseModel';
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

  // Create a new user
  async createUser(data: CreateUserData): Promise<User> {
    const userData = {
      username: data.username,
      email: data.email,
      password_hash: this.hashPassword(data.password)
    };
    return this.create(userData);
  }

  // Update a user
  async updateUser(id: number, data: UpdateUserData): Promise<User | null> {
    const updateData: Record<string, any> = {};
    
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password_hash = this.hashPassword(data.password);

    const result = await this.update({ id }, updateData);
    return result[0] || null;
  }

  // Find user by username or email
  async findByCredentials(username: string): Promise<User | null> {
    return this.findOne({
      username
    });
  }

  // Verify user credentials
  async verifyCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.findByCredentials(username);
    if (!user) return null;

    const hashedPassword = this.hashPassword(password);
    return user.password_hash === hashedPassword ? user : null;
  }

  // Delete a user
  async deleteUser(id: number): Promise<User | null> {
    const result = await this.delete({ id });
    return result[0] || null;
  }
}

// Export a singleton instance
export default new UserModel(); 