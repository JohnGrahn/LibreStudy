import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Mantine from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/api';

interface Card {
  id: number;
  front: string;
  back: string;
  interval: number;
  ease_factor: number;
  due_date: string;
  created_at: string;
}

interface Deck {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export default function StudyDeck() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeckAndCards();
  }, [id]);

  const fetchDeckAndCards = async () => {
    try {
      const [deckData, cardsData] = await Promise.all([
        api(`/decks/${id}`),
        api(`/decks/${id}/cards`)
      ]);

      setDeck(deckData);
      setCards(cardsData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load deck data',
        color: 'red'
      });
      navigate('/decks');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (quality: number) => {
    const card = cards[currentCardIndex];
    if (!card) return;

    try {
      const updatedCard = await api(`/decks/${id}/cards/${card.id}`, {
        method: 'PATCH',
        body: {
          interval: calculateInterval(card.interval, card.ease_factor, quality),
          ease_factor: calculateEaseFactor(card.ease_factor, quality),
          due_date: calculateDueDate(card.interval, quality)
        }
      });

      setCards(cards.map(c => c.id === updatedCard.id ? updatedCard : c));
      nextCard();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update card progress',
        color: 'red'
      });
    }
  };

  const calculateInterval = (currentInterval: number, easeFactor: number, quality: number) => {
    if (quality < 3) return 1;
    if (currentInterval === 0) return 1;
    if (currentInterval === 1) return 6;
    return Math.round(currentInterval * easeFactor);
  };

  const calculateEaseFactor = (currentEaseFactor: number, quality: number) => {
    const newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(1.3, newEaseFactor);
  };

  const calculateDueDate = (interval: number, quality: number) => {
    const date = new Date();
    if (quality < 3) {
      date.setMinutes(date.getMinutes() + 10);
    } else {
      date.setDate(date.getDate() + interval);
    }
    return date.toISOString();
  };

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      notifications.show({
        title: 'Congratulations!',
        message: 'You have completed studying this deck!',
        color: 'green'
      });
      navigate(`/decks/${id}`);
    }
  };

  if (loading) {
    return (
      <Mantine.Container size="lg">
        <Mantine.Center h={400}>
          <Mantine.Loader size="xl" />
        </Mantine.Center>
      </Mantine.Container>
    );
  }

  if (!deck || cards.length === 0) {
    return (
      <Mantine.Container size="lg">
        <Mantine.Paper p="xl" withBorder>
          <Mantine.Text ta="center" c="dimmed">
            No cards available to study in this deck.
          </Mantine.Text>
          <Mantine.Group justify="center" mt="md">
            <Mantine.Button onClick={() => navigate(`/decks/${id}`)}>
              Back to Deck
            </Mantine.Button>
          </Mantine.Group>
        </Mantine.Paper>
      </Mantine.Container>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <Mantine.Container size="lg">
      <Mantine.Paper p="xl" withBorder>
        <Mantine.Group justify="space-between" mb="xl">
          <Mantine.Title order={2}>{deck.title}</Mantine.Title>
          <Mantine.Text>Card {currentCardIndex + 1} of {cards.length}</Mantine.Text>
        </Mantine.Group>

        <Mantine.Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <Mantine.Text fw={500} size="lg" mb="md">
            {showAnswer ? 'Answer:' : 'Question:'}
          </Mantine.Text>
          <Mantine.Text size="md">
            {showAnswer ? currentCard.back : currentCard.front}
          </Mantine.Text>
        </Mantine.Card>

        {!showAnswer ? (
          <Mantine.Button
            fullWidth
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
          </Mantine.Button>
        ) : (
          <Mantine.Stack>
            <Mantine.Text fw={500} ta="center">How well did you know this?</Mantine.Text>
            <Mantine.Group justify="center">
              <Mantine.Button
                color="red"
                onClick={() => handleAnswer(1)}
              >
                Again
              </Mantine.Button>
              <Mantine.Button
                color="orange"
                onClick={() => handleAnswer(2)}
              >
                Hard
              </Mantine.Button>
              <Mantine.Button
                color="blue"
                onClick={() => handleAnswer(4)}
              >
                Good
              </Mantine.Button>
              <Mantine.Button
                color="green"
                onClick={() => handleAnswer(5)}
              >
                Easy
              </Mantine.Button>
            </Mantine.Group>
          </Mantine.Stack>
        )}
      </Mantine.Paper>
    </Mantine.Container>
  );
} 