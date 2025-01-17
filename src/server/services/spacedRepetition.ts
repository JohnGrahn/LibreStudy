import { CardModel, Card } from '../models/card';

// SuperMemo 2 algorithm constants
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;
const EASE_BONUS = 0.15;
const EASE_PENALTY = 0.2;

export interface ReviewGrade {
  grade: number; // 0-5, where 0 is complete blackout and 5 is perfect recall
  cardId: number;
}

export class SpacedRepetitionService {
  /**
   * Calculate the next interval and ease factor based on the review grade
   * Using the SuperMemo 2 algorithm
   */
  private static calculateNextInterval(
    grade: number,
    currentInterval: number | null,
    currentEaseFactor: number | null
  ): { interval: number; easeFactor: number } {
    // Initialize values if this is the first review
    const prevInterval = currentInterval || 0;
    let easeFactor = currentEaseFactor || DEFAULT_EASE_FACTOR;

    // Calculate new ease factor
    if (grade >= 3) {
      easeFactor = easeFactor + EASE_BONUS * (grade - 3);
    } else {
      easeFactor = easeFactor - EASE_PENALTY;
    }

    // Ensure ease factor doesn't go below minimum
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

    // Calculate next interval
    let interval: number;
    if (grade < 3) {
      // If grade is less than 3, reset to beginning
      interval = 1;
    } else if (prevInterval === 0) {
      // First successful review
      interval = 1;
    } else if (prevInterval === 1) {
      // Second successful review
      interval = 6;
    } else {
      // Calculate next interval using the ease factor
      interval = Math.round(prevInterval * easeFactor);
    }

    return { interval, easeFactor };
  }

  /**
   * Process a review and update the card's spaced repetition data
   */
  static async processReview(review: ReviewGrade): Promise<Card | null> {
    const card = await CardModel.findById(review.cardId);
    if (!card) {
      return null;
    }

    const { interval, easeFactor } = this.calculateNextInterval(
      review.grade,
      card.interval,
      card.ease_factor
    );

    // Calculate the next due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + interval);

    // Update the card with new spaced repetition data
    return CardModel.updateSpacedRepetition(
      card.id,
      interval,
      easeFactor,
      dueDate
    );
  }

  /**
   * Get cards that are due for review
   */
  static async getDueCards(deckId: number, limit: number = 10): Promise<Card[]> {
    return CardModel.getDueCards(deckId, limit);
  }

  /**
   * Reset a card's spaced repetition data
   */
  static async resetCard(cardId: number): Promise<Card | null> {
    return CardModel.updateSpacedRepetition(
      cardId,
      0,
      DEFAULT_EASE_FACTOR,
      new Date()
    );
  }
} 