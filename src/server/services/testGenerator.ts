import { Card } from '../models/card';
import { Test, TestModel } from '../models/test';
import { Question, QuestionModel, QuestionType } from '../models/question';
import { DeckModel } from '../models/deck';
import { CardModel } from '../models/card';

export interface GenerateTestOptions {
  userId: number;
  deckId: number;
  title: string;
  description?: string;
  questionCount?: number;
  questionTypes?: QuestionType[];
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
    const deck = await DeckModel.findById(options.deckId);
    if (!deck) {
      return null;
    }

    const cards = await this.getRandomCards(
      options.deckId,
      options.questionCount || this.DEFAULT_QUESTION_COUNT
    );

    if (cards.length === 0) {
      return null;
    }

    // Create the test
    const test = await TestModel.create({
      user_id: options.userId,
      deck_id: options.deckId,
      title: options.title,
      description: options.description
    });

    // Generate questions for each card
    const questionTypes = options.questionTypes || this.DEFAULT_QUESTION_TYPES;
    for (const card of cards) {
      const type = this.getRandomQuestionType(questionTypes);
      await this.generateQuestion(test.id, card, type);
    }

    return test;
  }

  /**
   * Get random cards from a deck
   */
  private static async getRandomCards(deckId: number, count: number): Promise<Card[]> {
    const cards = await CardModel.findByDeckId(deckId);
    if (cards.length === 0) {
      return [];
    }

    // Shuffle and slice
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Get a random question type from the available types
   */
  private static getRandomQuestionType(types: QuestionType[]): QuestionType {
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Generate a question based on a flashcard
   */
  private static async generateQuestion(
    testId: number,
    card: Card,
    type: QuestionType
  ): Promise<Question | null> {
    switch (type) {
      case 'multiple_choice':
        return this.generateMultipleChoiceQuestion(testId, card);
      case 'true_false':
        return this.generateTrueFalseQuestion(testId, card);
      case 'fill_in_the_blank':
        return this.generateFillInTheBlankQuestion(testId, card);
      case 'matching':
        return this.generateMatchingQuestion(testId, card);
      default:
        return null;
    }
  }

  /**
   * Generate a multiple-choice question
   */
  private static async generateMultipleChoiceQuestion(
    testId: number,
    card: Card
  ): Promise<Question> {
    // Create the question
    const question = await QuestionModel.create({
      test_id: testId,
      card_id: card.id,
      type: 'multiple_choice',
      content: card.front,
      options: [
        { content: card.back, is_correct: true },
        // TODO: Generate 3 plausible but incorrect options
        { content: 'Incorrect option 1', is_correct: false },
        { content: 'Incorrect option 2', is_correct: false },
        { content: 'Incorrect option 3', is_correct: false }
      ]
    });

    return question;
  }

  /**
   * Generate a true/false question
   */
  private static async generateTrueFalseQuestion(
    testId: number,
    card: Card
  ): Promise<Question> {
    const isTrue = Math.random() < 0.5;
    const statement = isTrue
      ? `${card.front} = ${card.back}`
      : `${card.front} = ${this.generateIncorrectAnswer(card.back)}`;

    return QuestionModel.create({
      test_id: testId,
      card_id: card.id,
      type: 'true_false',
      content: statement,
      options: [
        { content: 'True', is_correct: isTrue },
        { content: 'False', is_correct: !isTrue }
      ]
    });
  }

  /**
   * Generate a fill-in-the-blank question
   */
  private static async generateFillInTheBlankQuestion(
    testId: number,
    card: Card
  ): Promise<Question> {
    const blankText = card.front.replace(/\b\w+\b/, '_____');

    return QuestionModel.create({
      test_id: testId,
      card_id: card.id,
      type: 'fill_in_the_blank',
      content: blankText
    });
  }

  /**
   * Generate a matching question
   */
  private static async generateMatchingQuestion(
    testId: number,
    card: Card
  ): Promise<Question> {
    return QuestionModel.create({
      test_id: testId,
      card_id: card.id,
      type: 'matching',
      content: 'Match the following:',
      options: [
        { content: card.front, match_id: 1 },
        { content: card.back, match_id: 1 }
        // TODO: Add more matching pairs from other cards
      ]
    });
  }

  /**
   * Generate an incorrect but plausible answer for true/false questions
   */
  private static generateIncorrectAnswer(correctAnswer: string): string {
    // TODO: Implement more sophisticated incorrect answer generation
    return `Not ${correctAnswer}`;
  }
} 