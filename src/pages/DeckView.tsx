import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Mantine from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash } from '../components/Icons';

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

export default function DeckView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [newCard, setNewCard] = useState({ front: '', back: '' });

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
      setCards(cardsData);
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

  const handleSaveCard = async () => {
    const cardData = editingCard || newCard;
    const isEditing = !!editingCard;

    try {
      const response = await fetch(`/api/decks/${id}/cards${isEditing ? `/${editingCard?.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cardData)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} card`);
      }

      const savedCard = await response.json();

      if (isEditing) {
        setCards(cards.map(card => card.id === savedCard.id ? savedCard : card));
      } else {
        setCards([...cards, savedCard]);
      }

      notifications.show({
        title: 'Success',
        message: `Card ${isEditing ? 'updated' : 'created'} successfully`,
        color: 'green'
      });

      handleCloseCardModal();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to ${isEditing ? 'update' : 'create'} card`,
        color: 'red'
      });
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    try {
      const response = await fetch(`/api/decks/${id}/cards/${cardId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      setCards(cards.filter(card => card.id !== cardId));
      notifications.show({
        title: 'Success',
        message: 'Card deleted successfully',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete card',
        color: 'red'
      });
    }
  };

  const handleCloseCardModal = () => {
    setCardModalOpen(false);
    setEditingCard(null);
    setNewCard({ front: '', back: '' });
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

  if (!deck) {
    return null;
  }

  return (
    <Mantine.Container size="lg">
      <Mantine.Group justify="space-between" mb="xl">
        <div>
          <Mantine.Title order={2}>{deck.title}</Mantine.Title>
          <Mantine.Text c="dimmed" mt="xs">{deck.description}</Mantine.Text>
        </div>
        <Mantine.Group>
          <Mantine.Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setCardModalOpen(true)}
          >
            Add Card
          </Mantine.Button>
          <Mantine.Button
            component="a"
            href={`/decks/${id}/study`}
            variant="light"
          >
            Study Deck
          </Mantine.Button>
        </Mantine.Group>
      </Mantine.Group>

      {cards.length === 0 ? (
        <Mantine.Paper p="xl" withBorder>
          <Mantine.Text ta="center" c="dimmed">
            No cards in this deck yet. Click "Add Card" to create your first flashcard!
          </Mantine.Text>
        </Mantine.Paper>
      ) : (
        <Mantine.SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {cards.map(card => (
            <Mantine.Card key={card.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Mantine.Card.Section withBorder inheritPadding py="xs">
                <Mantine.Group justify="flex-end">
                  <Mantine.ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => {
                      setEditingCard(card);
                      setCardModalOpen(true);
                    }}
                  >
                    <IconEdit size={16} />
                  </Mantine.ActionIcon>
                  <Mantine.ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    <IconTrash size={16} />
                  </Mantine.ActionIcon>
                </Mantine.Group>
              </Mantine.Card.Section>

              <Mantine.Text fw={500} mt="md">Front:</Mantine.Text>
              <Mantine.Text size="sm">{card.front}</Mantine.Text>

              <Mantine.Text fw={500} mt="md">Back:</Mantine.Text>
              <Mantine.Text size="sm">{card.back}</Mantine.Text>
            </Mantine.Card>
          ))}
        </Mantine.SimpleGrid>
      )}

      <Mantine.Modal
        opened={cardModalOpen}
        onClose={handleCloseCardModal}
        title={editingCard ? 'Edit Card' : 'Add New Card'}
      >
        <Mantine.Stack>
          <Mantine.Textarea
            label="Front"
            placeholder="Enter the front of the card"
            required
            minRows={3}
            value={editingCard?.front ?? newCard.front}
            onChange={(e) => {
              if (editingCard) {
                setEditingCard({ ...editingCard, front: e.currentTarget.value });
              } else {
                setNewCard({ ...newCard, front: e.currentTarget.value });
              }
            }}
          />

          <Mantine.Textarea
            label="Back"
            placeholder="Enter the back of the card"
            required
            minRows={3}
            value={editingCard?.back ?? newCard.back}
            onChange={(e) => {
              if (editingCard) {
                setEditingCard({ ...editingCard, back: e.currentTarget.value });
              } else {
                setNewCard({ ...newCard, back: e.currentTarget.value });
              }
            }}
          />

          <Mantine.Group justify="flex-end" mt="md">
            <Mantine.Button variant="light" onClick={handleCloseCardModal}>
              Cancel
            </Mantine.Button>
            <Mantine.Button onClick={handleSaveCard}>
              {editingCard ? 'Save Changes' : 'Create Card'}
            </Mantine.Button>
          </Mantine.Group>
        </Mantine.Stack>
      </Mantine.Modal>
    </Mantine.Container>
  );
} 