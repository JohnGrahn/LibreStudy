import { Context } from 'hono';
import { sign } from 'hono/jwt';
import { sha256 } from 'hono/utils/crypto';
import { UserModel } from '../models/user';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly SALT_ROUNDS = 10;

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
   * Login a user with email/username and password
   */
  static async login(emailOrUsername: string, password: string): Promise<{ token: string; user: any } | null> {
    // Try to find user by email first, then username
    const user = await UserModel.findByEmail(emailOrUsername) || 
                await UserModel.findByUsername(emailOrUsername);

    if (!user) {
      return null;
    }

    const isValid = await this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    const token = await this.generateToken(user.id, user.username);
    return { token, user: { id: user.id, username: user.username, email: user.email } };
  }

  /**
   * Register a new user
   */
  static async register(username: string, email: string, password: string): Promise<{ token: string; user: any } | null> {
    // Check if username or email already exists
    const [existingUsername, existingEmail] = await Promise.all([
      UserModel.findByUsername(username),
      UserModel.findByEmail(email)
    ]);

    if (existingUsername || existingEmail) {
      return null;
    }

    // Create new user
    const passwordHash = await this.hashPassword(password);
    const user = await UserModel.create({
      username,
      email,
      password_hash: passwordHash
    });

    const token = await this.generateToken(user.id, user.username);
    return { token, user: { id: user.id, username: user.username, email: user.email } };
  }
} 