import type { Card } from '../models/CardModel';
import cardModel from '../models/CardModel';
import type { Test } from '../models/TestModel';
import testModel from '../models/TestModel';
import type { Question, QuestionType } from '../models/QuestionModel';
import questionModel from '../models/QuestionModel';
import deckModel from '../models/DeckModel';

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
    const deck = await deckModel.getDeck(options.deckId, options.userId);
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
    const test = await testModel.createTest({
      user_id: options.userId,
      deck_id: options.deckId,
      title: options.title,
      description: options.description
    });

    // Generate questions for each card
    await Promise.all(
      cards.map(card => this.generateQuestionFromCard(test.id, card))
    );

    return test;
  }

  /**
   * Get random cards from a deck
   */
  private static async getRandomCards(deckId: number, count: number): Promise<Card[]> {
    const cards = await cardModel.getDeckCards(deckId);
    if (cards.length === 0) {
      return [];
    }

    // Shuffle array and take the first 'count' elements
    return cards
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, cards.length));
  }

  /**
   * Generate a question from a flashcard
   */
  private static async generateQuestionFromCard(testId: number, card: Card): Promise<Question> {
    // Randomly select a question type
    const questionType = this.DEFAULT_QUESTION_TYPES[
      Math.floor(Math.random() * this.DEFAULT_QUESTION_TYPES.length)
    ];

    // Create base question
    const question = await questionModel.createQuestion({
      test_id: testId,
      card_id: card.id,
      type: questionType,
      content: card.front
    });

    // Generate options based on question type
    switch (questionType) {
      case 'multiple_choice':
        await this.generateMultipleChoiceOptions(question.id, card);
        break;
      case 'true_false':
        await this.generateTrueFalseOptions(question.id, card);
        break;
      case 'fill_in_the_blank':
        // Fill in the blank doesn't need options
        break;
    }

    return question;
  }

  /**
   * Generate multiple choice options for a question
   */
  private static async generateMultipleChoiceOptions(questionId: number, card: Card): Promise<void> {
    // Add correct answer
    await questionModel.updateQuestionOptions(questionId, [{
      content: card.back,
      is_correct: true
    }]);

    // TODO: Generate plausible wrong answers
    // For now, just add some dummy options
    const wrongOptions = [
      { content: 'Wrong answer 1', is_correct: false },
      { content: 'Wrong answer 2', is_correct: false },
      { content: 'Wrong answer 3', is_correct: false }
    ];

    await questionModel.updateQuestionOptions(questionId, wrongOptions);
  }

  /**
   * Generate true/false options for a question
   */
  private static async generateTrueFalseOptions(questionId: number, card: Card): Promise<void> {
    const isCorrectAnswer = Math.random() > 0.5;
    const questionContent = isCorrectAnswer ? card.back : 'Wrong answer';

    await questionModel.updateQuestionOptions(questionId, [{
      content: questionContent,
      is_correct: isCorrectAnswer
    }]);
  }
} 