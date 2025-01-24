import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as Mantine from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/api';

interface DeckProgress {
  totalCards: number;
  masteredCards: number;
  dueCards: number;
  lastStudied: Date | null;
  studyHistory: Array<{
    date: Date;
    cardsStudied: number;
    performance: {
      easy: number;
      good: number;
      hard: number;
      again: number;
    };
  }>;
  cardProgress: Array<{
    cardId: number;
    interval: number;
    easeFactor: number;
    lastGrade: number;
  }>;
}

export default function DeckProgress() {
  const { id } = useParams<{ id: string }>();
  const [progress, setProgress] = useState<DeckProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [id]);

  const loadProgress = async () => {
    try {
      const data = await api(`/progress/decks/${id}`);
      setProgress(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load progress data',
        color: 'red'
      });
    } finally {
      setLoading(false);
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

  if (!progress) {
    return (
      <Mantine.Container size="lg">
        <Mantine.Alert color="gray">No progress data available for this deck.</Mantine.Alert>
      </Mantine.Container>
    );
  }

  const masteryPercentage = (progress.masteredCards / progress.totalCards) * 100;
  const duePercentage = (progress.dueCards / progress.totalCards) * 100;

  return (
    <Mantine.Container size="lg">
      <Mantine.Title order={2} mb="xl">Deck Progress</Mantine.Title>

      <Mantine.SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {/* Overall Progress */}
        <Mantine.Card shadow="sm" padding="lg" radius="md" withBorder>
          <Mantine.Title order={3} mb="md">Overall Progress</Mantine.Title>
          <Mantine.RingProgress
            size={120}
            roundCaps
            thickness={8}
            sections={[
              { value: masteryPercentage, color: 'green', tooltip: 'Mastered' },
              { value: duePercentage, color: 'yellow', tooltip: 'Due for Review' },
            ]}
            label={
              <Mantine.Text ta="center" size="sm" fw={700}>
                {Math.round(masteryPercentage)}%
              </Mantine.Text>
            }
          />
          <Mantine.Stack mt="md">
            <Mantine.Text size="sm">Total Cards: {progress.totalCards}</Mantine.Text>
            <Mantine.Text size="sm" c="green">Mastered: {progress.masteredCards}</Mantine.Text>
            <Mantine.Text size="sm" c="yellow">Due for Review: {progress.dueCards}</Mantine.Text>
            {progress.lastStudied && (
              <Mantine.Text size="sm" c="dimmed">
                Last Studied: {new Date(progress.lastStudied).toLocaleDateString()}
              </Mantine.Text>
            )}
          </Mantine.Stack>
        </Mantine.Card>

        {/* Card Distribution */}
        <Mantine.Card shadow="sm" padding="lg" radius="md" withBorder>
          <Mantine.Title order={3} mb="md">Card Performance</Mantine.Title>
          <Mantine.Stack>
            {[
              { label: 'Easy', grade: 5, color: 'green' },
              { label: 'Good', grade: 4, color: 'blue' },
              { label: 'Hard', grade: 2, color: 'yellow' },
              { label: 'Again', grade: 1, color: 'red' },
              { label: 'New', grade: 0, color: 'gray' }
            ].map(category => {
              const count = progress.cardProgress.filter(
                card => card.lastGrade === category.grade
              ).length;
              const percentage = (count / progress.totalCards) * 100;

              return (
                <div key={category.label}>
                  <Mantine.Group justify="space-between" mb={5}>
                    <Mantine.Text size="sm">{category.label}</Mantine.Text>
                    <Mantine.Text size="sm">{count}</Mantine.Text>
                  </Mantine.Group>
                  <Mantine.Progress 
                    value={percentage}
                    color={category.color}
                    size="sm"
                  />
                </div>
              );
            })}
          </Mantine.Stack>
        </Mantine.Card>

        {/* Study History */}
        <Mantine.Card shadow="sm" padding="lg" radius="md" withBorder>
          <Mantine.Title order={3} mb="md">Study History</Mantine.Title>
          <Mantine.Stack>
            {progress.studyHistory.map((day, index) => (
              <div key={index}>
                <Mantine.Group justify="space-between" mb="xs">
                  <Mantine.Text size="sm">
                    {new Date(day.date).toLocaleDateString()}
                  </Mantine.Text>
                  <Mantine.Badge>
                    {day.cardsStudied} cards
                  </Mantine.Badge>
                </Mantine.Group>
                <Mantine.Group grow mb="md">
                  {day.performance.easy > 0 && (
                    <Mantine.Badge color="green" variant="light">
                      {day.performance.easy} Easy
                    </Mantine.Badge>
                  )}
                  {day.performance.good > 0 && (
                    <Mantine.Badge color="blue" variant="light">
                      {day.performance.good} Good
                    </Mantine.Badge>
                  )}
                  {day.performance.hard > 0 && (
                    <Mantine.Badge color="yellow" variant="light">
                      {day.performance.hard} Hard
                    </Mantine.Badge>
                  )}
                  {day.performance.again > 0 && (
                    <Mantine.Badge color="red" variant="light">
                      {day.performance.again} Again
                    </Mantine.Badge>
                  )}
                </Mantine.Group>
              </div>
            ))}
          </Mantine.Stack>
        </Mantine.Card>
      </Mantine.SimpleGrid>
    </Mantine.Container>
  );
} 