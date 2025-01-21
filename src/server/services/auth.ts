import { Context } from 'hono';
import { sign } from 'hono/jwt';
import { sha256 } from 'hono/utils/crypto';
import userModel from '../models/UserModel';
import type { User } from '../models/UserModel';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  /**
   * Hash a password using SHA-256
   */
  static async hashPassword(password: string): Promise<string> {
    return sha256(password);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }

  /**
   * Generate a JWT token for a user
   */
  static async generateToken(userId: number, username: string): Promise<string> {
    return sign({
      userId,
      username,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    }, this.JWT_SECRET);
  }

  /**
   * Check if a username already exists
   */
  static async checkUsername(username: string): Promise<boolean> {
    const user = await userModel.findByUsername(username);
    return !!user;
  }

  /**
   * Check if an email already exists
   */
  static async checkEmail(email: string): Promise<boolean> {
    const user = await userModel.findByEmail(email);
    return !!user;
  }

  /**
   * Login a user with email/username and password
   */
  static async login(emailOrUsername: string, password: string): Promise<{ token: string; user: any } | null> {
    // Try to find user by email or username
    const user = await userModel.findByEmail(emailOrUsername) || 
                await userModel.findByUsername(emailOrUsername);

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Generate token
    const token = await this.generateToken(user.id, user.username);
    return { token, user: { id: user.id, username: user.username, email: user.email } };
  }

  /**
   * Register a new user
   */
  static async register(username: string, email: string, password: string): Promise<{ token: string; user: any } | null> {
    // Hash password and create user
    const hashedPassword = await this.hashPassword(password);
    const user = await userModel.createUser({
      username,
      email,
      password: hashedPassword  // Changed back to password to match the CreateUserData interface
    });

    if (!user) {
      return null;
    }

    // Generate token
    const token = await this.generateToken(user.id, user.username);
    return { token, user: { id: user.id, username: user.username, email: user.email } };
  }
} 