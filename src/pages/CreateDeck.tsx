import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Mantine from '@mantine/core';
import { notifications } from '@mantine/notifications';

export default function CreateDeck() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to create deck');
      }

      const deck = await response.json();
      notifications.show({
        title: 'Success',
        message: 'Deck created successfully',
        color: 'green',
      });
      navigate(`/decks/${deck.id}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create deck',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mantine.Container size="sm">
      <Mantine.Title order={2} mb="xl">Create New Deck</Mantine.Title>
      
      <form onSubmit={handleSubmit}>
        <Mantine.Stack>
          <Mantine.TextInput
            label="Title"
            placeholder="Enter deck title"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />

          <Mantine.Textarea
            label="Description"
            placeholder="Enter deck description"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={3}
          />

          <Mantine.Group justify="flex-end" mt="md">
            <Mantine.Button
              variant="light"
              onClick={() => navigate('/decks')}
              disabled={loading}
            >
              Cancel
            </Mantine.Button>
            <Mantine.Button
              type="submit"
              loading={loading}
            >
              Create Deck
            </Mantine.Button>
          </Mantine.Group>
        </Mantine.Stack>
      </form>
    </Mantine.Container>
  );
} 