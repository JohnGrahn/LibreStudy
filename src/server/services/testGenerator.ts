import type { Card } from '../models/CardModel';
import cardModel from '../models/CardModel';
import type { Test } from '../models/TestModel';
import testModel from '../models/TestModel';
import type { Question, QuestionType } from '../models/QuestionModel';
import questionModel from '../models/QuestionModel';
import deckModel from '../models/DeckModel';
import type { CreateTestData } from '../models/TestModel';
import type { CreateQuestionData } from '../models/QuestionModel';

export interface GenerateTestOptions {
  userId: number;
  deckId: number;
  title: string;
  description?: string;
  questionCount?: number;
  questionTypes?: Array<'multiple_choice' | 'true_false' | 'fill_in_the_blank' | 'matching'>;
}

export class TestGeneratorService {
  private static readonly DEFAULT_QUESTION_COUNT = 10;
  private static readonly DEFAULT_QUESTION_TYPES: QuestionType[] = [
    'multiple_choice',
    'true_false',
    'fill_in_the_blank'
  ];

  /**
   * Generate a test from a deck of flashcards
   */
  static async generateTest(options: GenerateTestOptions): Promise<Test | null> {
    try {
      // Get cards from the deck
      const cards = await cardModel.getDeckCards(options.deckId);
      if (!cards.length) {
        throw new Error('No cards found in deck');
    }

    // Create the test
      const testData: CreateTestData = {
      user_id: options.userId,
      deck_id: options.deckId,
      title: options.title,
      description: options.description
      };

      const test = await testModel.createTest(testData);
      if (!test) {
        throw new Error('Failed to create test');
      }

      // Determine how many questions to generate
      const questionCount = options.questionCount || Math.min(cards.length, 20);
      const selectedCards = this.selectRandomCards(cards, questionCount);

      // Generate questions for each selected card
      const questions = await Promise.all(
        selectedCards.map(card => this.generateQuestion(test.id, card, options.questionTypes))
      );

      return {
        ...test,
        questions: questions.filter(q => q !== null)
      };
    } catch (error) {
      console.error('Error generating test:', error);
      return null;
    }
  }

  private static selectRandomCards(cards: Card[], count: number): Card[] {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private static async generateQuestion(
    testId: number,
    card: Card,
    allowedTypes?: Array<'multiple_choice' | 'true_false' | 'fill_in_the_blank' | 'matching'>
  ) {
    try {
      // If no types specified, use all types
      const types = allowedTypes || ['multiple_choice', 'true_false', 'fill_in_the_blank', 'matching'];
      const type = types[Math.floor(Math.random() * types.length)];

      const questionData: CreateQuestionData = {
      test_id: testId,
      card_id: card.id,
        type,
        content: '',
        correct_answer: '',
        options: []
      };

      switch (type) {
      case 'multiple_choice':
          return this.generateMultipleChoiceQuestion(questionData, card);
      case 'true_false':
          return this.generateTrueFalseQuestion(questionData, card);
      case 'fill_in_the_blank':
          return this.generateFillInBlankQuestion(questionData, card);
        case 'matching':
          return this.generateMatchingQuestion(questionData, card);
        default:
          throw new Error(`Unsupported question type: ${type}`);
      }
    } catch (error) {
      console.error('Error generating question:', error);
      return null;
    }
  }

  private static async generateMultipleChoiceQuestion(questionData: CreateQuestionData, card: Card) {
    // Use the card's front as the question
    questionData.content = card.front;
    questionData.correct_answer = card.back;

    // Generate 3 incorrect options
    const incorrectOptions = await this.generateIncorrectOptions(card, 3);
    
    // Add options with one correct answer and three incorrect
    questionData.options = [
      { content: card.back, is_correct: true },
      ...incorrectOptions.map(opt => ({ content: opt, is_correct: false }))
    ].sort(() => Math.random() - 0.5); // Shuffle options

    return await questionModel.createQuestion(questionData);
  }

  private static async generateTrueFalseQuestion(questionData: CreateQuestionData, card: Card) {
    const isTrue = Math.random() < 0.5;
    
    if (isTrue) {
      questionData.content = `True or False: "${card.front}" corresponds to "${card.back}"`;
      questionData.correct_answer = 'true';
    } else {
      const incorrectOptions = await this.generateIncorrectOptions(card, 1);
      questionData.content = `True or False: "${card.front}" corresponds to "${incorrectOptions[0]}"`;
      questionData.correct_answer = 'false';
    }

    return await questionModel.createQuestion(questionData);
  }

  private static async generateFillInBlankQuestion(questionData: CreateQuestionData, card: Card) {
    questionData.content = `Complete this statement: "${card.front}" corresponds to "________"`;
    questionData.correct_answer = card.back;
    return await questionModel.createQuestion(questionData);
  }

  private static async generateMatchingQuestion(questionData: CreateQuestionData, card: Card) {
    // Get 3 other cards for matching
    const otherCards = await cardModel.getDeckCards(card.deck_id);
    
    // Filter out the current card and get 3 random cards
    const selectedOtherCards = otherCards
      .filter(c => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allCards = [
      { front: card.front, back: card.back },
      ...selectedOtherCards.map(c => ({ front: c.front, back: c.back }))
    ];
    
    questionData.content = 'Match the following terms with their correct definitions:';
    questionData.correct_answer = card.back;

    // Create separate arrays for terms and definitions
    const terms = allCards.map((c, i) => ({
      content: c.front,
      match_id: i + 1,
      is_term: true
    }));

    const definitions = allCards.map((c, i) => ({
      content: c.back,
      match_id: i + 1,
      is_term: false
    }));

    // Shuffle both arrays separately
    questionData.options = [
      ...terms.sort(() => Math.random() - 0.5),
      ...definitions.sort(() => Math.random() - 0.5)
    ];

    return await questionModel.createQuestion(questionData);
  }

  private static async generateIncorrectOptions(card: Card, count: number): Promise<string[]> {
    try {
      // Get other cards from the same deck
      const otherCards = await cardModel.getDeckCards(card.deck_id);
      
      // Filter out the current card and get random incorrect options
      const incorrectOptions = otherCards
        .filter(c => c.id !== card.id)
        .map(c => c.back)
        .sort(() => Math.random() - 0.5)
        .slice(0, count);

      // If we don't have enough options, generate some variations
      while (incorrectOptions.length < count) {
        incorrectOptions.push(`Incorrect option ${incorrectOptions.length + 1}`);
      }

      return incorrectOptions;
    } catch (error) {
      console.error('Error generating incorrect options:', error);
      return Array(count).fill('').map((_, i) => `Incorrect option ${i + 1}`);
    }
  }
}

export default new TestGeneratorService(); 