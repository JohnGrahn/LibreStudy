import * as Mantine from '@mantine/core';
import { IconSearch, IconEdit, IconTrash } from '../components/Icons';
import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';

interface Deck {
  id: number;
  title: string;
  description: string;
  cardCount: number;
}

const DeckList = memo(function DeckList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const response = await fetch('/api/decks');
      if (!response.ok) {
        throw new Error('Failed to fetch decks');
      }
      const data = await response.json();
      setDecks(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch decks',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeck = async () => {
    if (!deckToDelete) return;

    try {
      const response = await fetch(`/api/decks/${deckToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete deck');
      }

      setDecks(decks.filter(deck => deck.id !== deckToDelete.id));
      notifications.show({
        title: 'Success',
        message: 'Deck deleted successfully',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete deck',
        color: 'red',
      });
    } finally {
      setDeleteModalOpen(false);
      setDeckToDelete(null);
    }
  };

  const filteredDecks = decks.filter(deck => 
    deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Mantine.Container size="lg">
        <Mantine.Center h={400}>
          <Mantine.Loader size="xl" />
        </Mantine.Center>
      </Mantine.Container>
    );
  }

  return (
    <Mantine.Container size="lg">
      <Mantine.Group justify="space-between" mb="xl">
        <Mantine.Title order={2}>My Decks</Mantine.Title>
        <Mantine.Button component={Link} to="/decks/new">Create New Deck</Mantine.Button>
      </Mantine.Group>

      <Mantine.TextInput
        placeholder="Search decks..."
        mb="lg"
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
      />

      {filteredDecks.length === 0 ? (
        <Mantine.Paper p="xl" withBorder>
          <Mantine.Text ta="center" c="dimmed">
            No decks found. Create your first deck to get started!
          </Mantine.Text>
        </Mantine.Paper>
      ) : (
        <Mantine.SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {filteredDecks.map(deck => (
            <Mantine.Card key={deck.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Mantine.Card.Section withBorder inheritPadding py="xs">
                <Mantine.Group justify="space-between">
                  <Mantine.Title order={3}>{deck.title}</Mantine.Title>
                  <Mantine.Group>
                    <Mantine.ActionIcon
                      component={Link}
                      to={`/decks/${deck.id}/edit`}
                      variant="subtle"
                      color="blue"
                    >
                      <IconEdit size={16} />
                    </Mantine.ActionIcon>
                    <Mantine.ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => {
                        setDeckToDelete(deck);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <IconTrash size={16} />
                    </Mantine.ActionIcon>
                  </Mantine.Group>
                </Mantine.Group>
              </Mantine.Card.Section>
              
              <Mantine.Text mt="md" size="sm" c="dimmed">
                {deck.cardCount} cards
              </Mantine.Text>
              
              <Mantine.Text mt="xs">
                {deck.description}
              </Mantine.Text>

              <Mantine.Group mt="md">
                <Mantine.Button component={Link} to={`/decks/${deck.id}`} variant="light">
                  View Deck
                </Mantine.Button>
                <Mantine.Button component={Link} to={`/decks/${deck.id}/study`} variant="filled">
                  Study
                </Mantine.Button>
              </Mantine.Group>
            </Mantine.Card>
          ))}
        </Mantine.SimpleGrid>
      )}

      <Mantine.Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeckToDelete(null);
        }}
        title="Delete Deck"
      >
        <Mantine.Text mb="lg">
          Are you sure you want to delete "{deckToDelete?.title}"? This action cannot be undone.
        </Mantine.Text>
        <Mantine.Group justify="flex-end">
          <Mantine.Button
            variant="light"
            onClick={() => {
              setDeleteModalOpen(false);
              setDeckToDelete(null);
            }}
          >
            Cancel
          </Mantine.Button>
          <Mantine.Button color="red" onClick={handleDeleteDeck}>
            Delete
          </Mantine.Button>
        </Mantine.Group>
      </Mantine.Modal>
    </Mantine.Container>
  );
});

export default DeckList; 