import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Mantine from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/api';

interface Card {
  id: number;
  front: string;
  back: string;
  last_grade: number;
}

interface Deck {
  id: number;
  title: string;
  description: string;
}

interface SessionStats {
  startTime: Date;
  cardsReviewed: number;
  correctStreak: number;
  longestStreak: number;
  performance: {
    easy: number;
    good: number;
    hard: number;
    again: number;
  }
}

export default function StudyMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    startTime: new Date(),
    cardsReviewed: 0,
    correctStreak: 0,
    longestStreak: 0,
    performance: {
      easy: 0,
      good: 0,
      hard: 0,
      again: 0
    }
  });

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
      // Shuffle the cards
      setCards(shuffleArray(cardsData));
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

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleAnswer = async (quality: number) => {
    const card = cards[currentCardIndex];
    if (!card) return;

    try {
      // Update the card's last grade
      await api(`/decks/${id}/cards/${card.id}`, {
        method: 'PATCH',
        body: {
          last_grade: quality
        }
      });

      // Update session stats
      setSessionStats(prev => {
        const newStats = { ...prev };
        newStats.cardsReviewed++;
        
        if (quality === 5) newStats.performance.easy++;
        else if (quality === 4) newStats.performance.good++;
        else if (quality === 2) newStats.performance.hard++;
        else if (quality === 1) newStats.performance.again++;

        if (quality >= 4) {
          newStats.correctStreak++;
          newStats.longestStreak = Math.max(newStats.longestStreak, newStats.correctStreak);
        } else {
          newStats.correctStreak = 0;
        }

        return newStats;
      });

      nextCard();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update card progress',
        color: 'red'
      });
    }
  };

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    } else {
      const sessionDuration = Math.round((new Date().getTime() - sessionStats.startTime.getTime()) / 1000 / 60);
      notifications.show({
        title: 'Study Session Complete!',
        message: `
          Time: ${sessionDuration} minutes
          Cards Reviewed: ${sessionStats.cardsReviewed}
          Longest Streak: ${sessionStats.longestStreak}
          Performance:
          - Easy: ${sessionStats.performance.easy}
          - Good: ${sessionStats.performance.good}
          - Hard: ${sessionStats.performance.hard}
          - Again: ${sessionStats.performance.again}
        `,
        color: 'green',
        autoClose: false
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
          <Mantine.Group>
            <Mantine.Text>Card {currentCardIndex + 1} of {cards.length}</Mantine.Text>
            <Mantine.Badge color={sessionStats.correctStreak > 0 ? "green" : "gray"}>
              Streak: {sessionStats.correctStreak}
            </Mantine.Badge>
          </Mantine.Group>
        </Mantine.Group>

        <Mantine.Box
          onClick={() => setShowAnswer(!showAnswer)}
          style={{ cursor: 'pointer', position: 'relative', minHeight: '200px' }}
        >
          <Mantine.Transition
            mounted={!showAnswer}
            transition={{
              in: { transform: 'rotateY(0deg)', opacity: 1 },
              out: { transform: 'rotateY(90deg)', opacity: 0 },
              common: { transformStyle: 'preserve-3d' },
              transitionProperty: 'transform, opacity'
            }}
            duration={600}
            timingFunction="ease"
          >
            {(styles) => (
              <Mantine.Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                mb="xl"
                style={{ ...styles, position: 'absolute', width: '100%' }}
              >
                <Mantine.Text fw={500} size="lg" mb="md">Question:</Mantine.Text>
                <Mantine.Text size="md">{currentCard.front}</Mantine.Text>
              </Mantine.Card>
            )}
          </Mantine.Transition>

          <Mantine.Transition
            mounted={showAnswer}
            transition={{
              in: { transform: 'rotateY(0deg)', opacity: 1 },
              out: { transform: 'rotateY(-90deg)', opacity: 0 },
              common: { transformStyle: 'preserve-3d' },
              transitionProperty: 'transform, opacity'
            }}
            duration={600}
            timingFunction="ease"
          >
            {(styles) => (
              <Mantine.Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                mb="xl"
                style={{ ...styles, position: 'absolute', width: '100%' }}
              >
                <Mantine.Text fw={500} size="lg" mb="md">Answer:</Mantine.Text>
                <Mantine.Text size="md">{currentCard.back}</Mantine.Text>
              </Mantine.Card>
            )}
          </Mantine.Transition>
        </Mantine.Box>

        {showAnswer && (
          <Mantine.Stack>
            <Mantine.Text fw={500} ta="center">How well did you know this?</Mantine.Text>
            <Mantine.Group justify="center">
              <Mantine.Button
                color="red"
                onClick={() => handleAnswer(1)}
              >
                Again ({sessionStats.performance.again})
              </Mantine.Button>
              <Mantine.Button
                color="orange"
                onClick={() => handleAnswer(2)}
              >
                Hard ({sessionStats.performance.hard})
              </Mantine.Button>
              <Mantine.Button
                color="blue"
                onClick={() => handleAnswer(4)}
              >
                Good ({sessionStats.performance.good})
              </Mantine.Button>
              <Mantine.Button
                color="green"
                onClick={() => handleAnswer(5)}
              >
                Easy ({sessionStats.performance.easy})
              </Mantine.Button>
            </Mantine.Group>
          </Mantine.Stack>
        )}
      </Mantine.Paper>
    </Mantine.Container>
  );
} 