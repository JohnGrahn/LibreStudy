import { DeckModel, Deck, CreateDeckData } from '../models/DeckModel';
import { CardModel, Card, CreateCardData } from '../models/CardModel';
import { PoolClient } from 'pg';
import deckModel from '../models/DeckModel';
import cardModel from '../models/CardModel';

interface ImportedDeck {
  title: string;
  description?: string;
  cards: {
    front: string;
    back: string;
  }[];
}

interface ExportedDeck extends Deck {
  cards: Card[];
}

export class ImportExportService {
  /**
   * Import a deck from JSON format
   */
  static async importDeckFromJSON(userId: number, jsonData: string): Promise<Deck | null> {
    try {
      const importedData = JSON.parse(jsonData) as ImportedDeck;
      
      // Create the deck
      const deck = await deckModel.create({
        user_id: userId,
        title: importedData.title,
        description: importedData.description
      });

      // Create all cards
      if (importedData.cards && importedData.cards.length > 0) {
        const cardData: CreateCardData[] = importedData.cards.map(card => ({
          deck_id: deck.id,
          front: card.front,
          back: card.back
        }));

        await cardModel.create(cardData[0]);
        for (let i = 1; i < cardData.length; i++) {
          await cardModel.create(cardData[i]);
        }
      }

      return deck;
    } catch (error) {
      console.error('Error importing deck:', error);
      return null;
    }
  }

  /**
   * Import a deck from CSV format
   * Expected format: front,back
   */
  static async importDeckFromCSV(
    userId: number,
    title: string,
    description: string | undefined,
    csvData: string
  ): Promise<Deck | null> {
    try {
      // Parse CSV (simple implementation, assuming no commas in content)
      const lines = csvData.split('\n').filter(line => line.trim());
      const cards = lines.map(line => {
        const [front, back] = line.split(',').map(str => str.trim());
        return { front, back };
      });

      return this.importDeckFromJSON(userId, JSON.stringify({
        title,
        description,
        cards
      }));
    } catch (error) {
      console.error('Error importing deck from CSV:', error);
      return null;
    }
  }

  /**
   * Export a deck to JSON format
   */
  static async exportDeckToJSON(deckId: number, userId: number): Promise<string | null> {
    try {
      // Get deck with cards
      const deck = await deckModel.findOne({ id: deckId, user_id: userId });
      if (!deck) return null;

      const cards = await cardModel.find({ deck_id: deckId });

      const exportData: ExportedDeck = {
        ...deck,
        cards
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting deck:', error);
      return null;
    }
  }

  /**
   * Export a deck to CSV format
   */
  static async exportDeckToCSV(deckId: number, userId: number): Promise<string | null> {
    try {
      // Get cards for the deck
      const cards = await cardModel.find({ deck_id: deckId });
      if (!cards.length) return null;

      // Convert to CSV format
      const csvLines = cards.map(card => {
        // Escape any commas in the content
        const front = card.front.replace(/,/g, '\\,');
        const back = card.back.replace(/,/g, '\\,');
        return `${front},${back}`;
      });

      return csvLines.join('\n');
    } catch (error) {
      console.error('Error exporting deck to CSV:', error);
      return null;
    }
  }

  /**
   * Validate imported data structure
   */
  static validateImportedData(data: any): data is ImportedDeck {
    return (
      typeof data === 'object' &&
      typeof data.title === 'string' &&
      (!data.description || typeof data.description === 'string') &&
      Array.isArray(data.cards) &&
      data.cards.every((card: any) =>
        typeof card === 'object' &&
        typeof card.front === 'string' &&
        typeof card.back === 'string'
      )
    );
  }
} 