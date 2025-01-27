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
  Tabs,
  Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/api';

interface Deck {
  id: number;
  title: string;
  description: string;
  created_at: string;
  is_public: boolean;
  creator_name?: string;
}

export default function DeckList() {
  const [personalDecks, setPersonalDecks] = useState<Deck[]>([]);
  const [publicDecks, setPublicDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('personal');

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const [personalData, publicData] = await Promise.all([
        api('/decks'),
        api('/decks?type=public')
      ]);
      setPersonalDecks(personalData);
      setPublicDecks(publicData);
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

  const renderDeckGrid = (decks: Deck[], showCreator = false) => {
    if (decks.length === 0) {
      return (
        <Card withBorder p="xl" radius="md">
          <Text ta="center" c="dimmed">
            {activeTab === 'personal' 
              ? "You don't have any decks yet. Create your first deck to get started!"
              : "No public decks available yet."}
          </Text>
          {activeTab === 'personal' && (
            <Center mt="md">
              <Button component={Link} to="/decks/new">
                Create Your First Deck
              </Button>
            </Center>
          )}
        </Card>
      );
    }

    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {decks.map((deck) => (
          <Card key={deck.id} withBorder component={Link} to={`/decks/${deck.id}`}>
            <Card.Section withBorder inheritPadding py="xs">
              <Group justify="space-between">
                <Title order={3} size="h4">
                  {deck.title}
                </Title>
                {deck.is_public && <Badge color="blue">Public</Badge>}
              </Group>
            </Card.Section>
            <Text mt="sm" lineClamp={2}>
              {deck.description || 'No description'}
            </Text>
            <Group mt="md" justify="space-between">
              <Text size="sm" c="dimmed">
                Created: {new Date(deck.created_at).toLocaleDateString()}
              </Text>
              {showCreator && deck.creator_name && (
                <Text size="sm" c="dimmed">
                  By: {deck.creator_name}
                </Text>
              )}
            </Group>
          </Card>
        ))}
      </SimpleGrid>
    );
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
        <Title order={2}>Flashcard Decks</Title>
        <Button component={Link} to="/decks/new">
          Create New Deck
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="personal">
            Your Decks
          </Tabs.Tab>
          <Tabs.Tab value="public">
            Public Decks
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="personal">
          {renderDeckGrid(personalDecks)}
        </Tabs.Panel>

        <Tabs.Panel value="public">
          {renderDeckGrid(publicDecks, true)}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
} 