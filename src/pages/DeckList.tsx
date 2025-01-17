import * as Mantine from '@mantine/core';
import { IconSearch } from '../components/Icons';
import { useState, memo } from 'react';
import { Link } from 'react-router-dom';

// Temporary mock data
const mockDecks = [
  { id: 1, title: 'Spanish Vocabulary', cardCount: 50, description: 'Basic Spanish words and phrases' },
  { id: 2, title: 'JavaScript Basics', cardCount: 30, description: 'Fundamental JavaScript concepts' },
  { id: 3, title: 'World Capitals', cardCount: 195, description: 'Capital cities of countries' },
];

const DeckList = memo(function DeckList() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredDecks = mockDecks.filter(deck => 
    deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <Mantine.SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {filteredDecks.map(deck => (
          <Mantine.Card key={deck.id} shadow="sm" padding="lg" radius="md" withBorder>
            <Mantine.Card.Section withBorder inheritPadding py="xs">
              <Mantine.Title order={3}>{deck.title}</Mantine.Title>
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
    </Mantine.Container>
  );
});

export default DeckList; 