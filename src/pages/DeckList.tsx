import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Title,
  Button,
  Group,
  Card,
  Text,
  SimpleGrid,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/api';

interface Deck {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export default function DeckList() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const data = await api('/decks');
      setDecks(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load decks',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Text>Loading decks...</Text>
      </Center>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Your Decks</Title>
        <Button component={Link} to="/decks/new">
          Create New Deck
        </Button>
      </Group>

      {decks.length === 0 ? (
        <Card withBorder p="xl" radius="md">
          <Text ta="center" c="dimmed">
            You don't have any decks yet. Create your first deck to get started!
          </Text>
          <Center mt="md">
            <Button component={Link} to="/decks/new">
              Create Your First Deck
            </Button>
          </Center>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {decks.map((deck) => (
            <Card key={deck.id} withBorder component={Link} to={`/decks/${deck.id}`}>
              <Card.Section withBorder inheritPadding py="xs">
                <Title order={3} size="h4">
                  {deck.title}
                </Title>
              </Card.Section>
              <Text mt="sm" lineClamp={2}>
                {deck.description || 'No description'}
              </Text>
              <Text size="sm" c="dimmed" mt="md">
                Created: {new Date(deck.created_at).toLocaleDateString()}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
} 