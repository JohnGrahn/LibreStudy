import { AuthService } from '../services/auth';
import DeckModel from '../models/DeckModel';
import UserModel from '../models/UserModel';
import pool from './config';

const sampleDecks = [
  {
    title: 'Basic Mathematics',
    description: 'Fundamental mathematics concepts',
    is_public: true,
    cards: [
      { front: 'What is 2 + 2?', back: '4' },
      { front: 'What is the square root of 16?', back: '4' },
      { front: 'What is 5 × 7?', back: '35' }
    ]
  },
  {
    title: 'World Capitals',
    description: 'Learn capital cities around the world',
    is_public: true,
    cards: [
      { front: 'What is the capital of France?', back: 'Paris' },
      { front: 'What is the capital of Japan?', back: 'Tokyo' },
      { front: 'What is the capital of Brazil?', back: 'Brasília' }
    ]
  },
  {
    title: 'Basic Programming Concepts',
    description: 'Learn fundamental programming concepts',
    is_public: true,
    cards: [
      { front: 'What is a variable?', back: 'A container for storing data values' },
      { front: 'What is a function?', back: 'A reusable block of code that performs a specific task' },
      { front: 'What is a loop?', back: 'A control structure that repeats a block of code multiple times' }
    ]
  }
];

async function createCards(deckId: number, cards: { front: string; back: string }[]) {
  for (const card of cards) {
    await pool.query(
      'INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3)',
      [deckId, card.front, card.back]
    );
  }
}

async function seed() {
  try {
    // Check required environment variables
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error('Missing required environment variables: ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set');
    }

    // Check if admin user already exists
    const adminExists = await AuthService.checkEmail(process.env.ADMIN_EMAIL);
    if (adminExists) {
      console.log('Admin user already exists, skipping seed');
      return;
    }

    // Create admin user
    const hashedPassword = await AuthService.hashPassword(process.env.ADMIN_PASSWORD);
    const adminUser = await UserModel.createUser({
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword
    });

    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    // Create sample decks
    for (const deck of sampleDecks) {
      const newDeck = await DeckModel.createDeck({
        user_id: adminUser.id,
        title: deck.title,
        description: deck.description,
        is_public: deck.is_public
      });

      if (newDeck) {
        await createCards(newDeck.id, deck.cards);
      }
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seed; 