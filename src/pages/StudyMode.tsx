import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Mantine from '@mantine/core';
import { notifications } from '@mantine/notifications';

interface Card {
  id: number;
  front: string;
  back: string;
  created_at: string;
}

interface Deck {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export default function StudyMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeckAndCards();
  }, [id]);

  const fetchDeckAndCards = async () => {
    try {
      const [deckResponse, cardsResponse] = await Promise.all([
        fetch(`/api/decks/${id}`),
        fetch(`/api/decks/${id}/cards`)
      ]);

      if (!deckResponse.ok || !cardsResponse.ok) {
        throw new Error('Failed to fetch deck data');
      }

      const [deckData, cardsData] = await Promise.all([
        deckResponse.json(),
        cardsResponse.json()
      ]);

      setDeck(deckData);
      setCards(shuffleArray(cardsData));
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load deck data',
        color: 'red'
      });
      navigate('/decks');
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReshuffle = () => {
    setCards(shuffleArray(cards));
    setCurrentCardIndex(0);
    setIsFlipped(false);
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
      <Mantine.Container size="sm">
        <Mantine.Paper p="xl" withBorder>
          <Mantine.Text ta="center" c="dimmed">
            This deck has no cards to study. Add some cards first!
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
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  return (
    <Mantine.Container size="sm">
      <Mantine.Stack>
        <Mantine.Group justify="space-between">
          <Mantine.Title order={2}>{deck.title}</Mantine.Title>
          <Mantine.Button variant="light" onClick={() => navigate(`/decks/${id}`)}>
            Exit Study Mode
          </Mantine.Button>
        </Mantine.Group>

        <Mantine.Progress value={progress} mb="md" />

        <Mantine.Text size="sm" c="dimmed" ta="center">
          Card {currentCardIndex + 1} of {cards.length}
        </Mantine.Text>

        <Mantine.Paper
          p="xl"
          withBorder
          style={{
            cursor: 'pointer',
            minHeight: '200px',
            perspective: '1000px',
          }}
          onClick={handleFlip}
        >
          <Mantine.Stack
            style={{
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s',
            }}
          >
            <Mantine.Center>
              <Mantine.Text size="lg" style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
                {isFlipped ? currentCard.back : currentCard.front}
              </Mantine.Text>
            </Mantine.Center>
          </Mantine.Stack>
        </Mantine.Paper>

        <Mantine.Text size="sm" c="dimmed" ta="center">
          Click the card to flip it
        </Mantine.Text>

        <Mantine.Group justify="center" mt="xl">
          <Mantine.Button
            variant="light"
            onClick={handlePrevious}
            disabled={currentCardIndex === 0}
          >
            Previous
          </Mantine.Button>
          <Mantine.Button
            variant="light"
            onClick={handleReshuffle}
          >
            Reshuffle
          </Mantine.Button>
          <Mantine.Button
            onClick={handleNext}
            disabled={currentCardIndex === cards.length - 1}
          >
            Next
          </Mantine.Button>
        </Mantine.Group>
      </Mantine.Stack>
    </Mantine.Container>
  );
} 