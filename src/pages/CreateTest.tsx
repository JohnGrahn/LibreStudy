import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Mantine from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/api';

interface Deck {
  id: number;
  title: string;
  description: string;
}

export default function CreateTest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deck_id: '',
    question_count: 10
  });

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
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deck_id) {
      notifications.show({
        title: 'Error',
        message: 'Please select a deck',
        color: 'red'
      });
      return;
    }

    setSubmitting(true);
    try {
      const test = await api('/tests', {
        method: 'POST',
        body: {
          title: formData.title,
          description: formData.description,
          deck_id: parseInt(formData.deck_id),
          question_count: formData.question_count
        }
      });

      notifications.show({
        title: 'Success',
        message: 'Test created successfully',
        color: 'green'
      });

      navigate(`/tests/${test.id}/take`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create test',
        color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Mantine.Center h="100vh">
        <Mantine.Loader size="xl" />
      </Mantine.Center>
    );
  }

  if (decks.length === 0) {
    return (
      <Mantine.Container size="sm">
        <Mantine.Paper shadow="sm" p="xl" withBorder>
          <Mantine.Text ta="center" mb="md">
            You need to create a deck before you can create a test.
          </Mantine.Text>
          <Mantine.Center>
            <Mantine.Button onClick={() => navigate('/decks/new')}>
              Create Deck
            </Mantine.Button>
          </Mantine.Center>
        </Mantine.Paper>
      </Mantine.Container>
    );
  }

  return (
    <Mantine.Container size="sm">
      <Mantine.Title order={2} mb="xl">Create New Test</Mantine.Title>

      <form onSubmit={handleSubmit}>
        <Mantine.Paper shadow="sm" p="xl" withBorder>
          <Mantine.Stack>
            <Mantine.Select
              label="Select Deck"
              placeholder="Choose a deck"
              data={decks.map(deck => ({
                value: deck.id.toString(),
                label: deck.title
              }))}
              value={formData.deck_id}
              onChange={(value) => setFormData({ ...formData, deck_id: value || '' })}
              required
            />

            <Mantine.TextInput
              label="Test Title"
              placeholder="Enter test title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.currentTarget.value })}
              required
            />

            <Mantine.Textarea
              label="Description"
              placeholder="Enter test description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
            />

            <Mantine.NumberInput
              label="Number of Questions"
              description="How many questions should be in the test"
              value={formData.question_count}
              onChange={(value) => setFormData({ ...formData, question_count: typeof value === 'number' ? value : 10 })}
              min={1}
              max={50}
              required
            />

            <Mantine.Group justify="flex-end" mt="md">
              <Mantine.Button variant="light" onClick={() => navigate('/tests')}>
                Cancel
              </Mantine.Button>
              <Mantine.Button type="submit" loading={submitting}>
                Create Test
              </Mantine.Button>
            </Mantine.Group>
          </Mantine.Stack>
        </Mantine.Paper>
      </form>
    </Mantine.Container>
  );
} 
