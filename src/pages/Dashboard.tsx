import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../lib/api';

interface DashboardStats {
  totalDecks: number;
  totalCards: number;
  cardsToReview: number;
  completedTests: number;
}

interface RecentDeck {
  id: number;
  title: string;
  cardCount: number;
  lastStudied: string | null;
}

interface RecentTest {
  id: number;
  title: string;
  score: number;
  completedAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDecks, setRecentDecks] = useState<RecentDeck[]>([]);
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, decksData, testsData] = await Promise.all([
        api('/stats'),
        api('/decks?limit=3'),
        api('/tests?limit=3')
      ]);

      setStats(statsData);
      setRecentDecks(decksData);
      setRecentTests(testsData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load dashboard data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Text>Loading dashboard...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="xl">Dashboard</Title>

      {/* Stats Overview */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
        <Paper withBorder p="md" radius="md">
          <Text size="lg" fw={500}>Total Decks</Text>
          <Text size="xl" fw={700}>{stats?.totalDecks || 0}</Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Text size="lg" fw={500}>Total Cards</Text>
          <Text size="xl" fw={700}>{stats?.totalCards || 0}</Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Text size="lg" fw={500}>Cards to Review</Text>
          <Text size="xl" fw={700}>{stats?.cardsToReview || 0}</Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Text size="lg" fw={500}>Tests Completed</Text>
          <Text size="xl" fw={700}>{stats?.completedTests || 0}</Text>
        </Paper>
      </SimpleGrid>

      <Grid gutter="xl">
        {/* Recent Decks */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Recent Decks</Title>
              <Button component={Link} to="/decks" variant="light">View All</Button>
            </Group>
            <Stack gap="md">
              {recentDecks.length === 0 ? (
                <Text c="dimmed">No decks created yet</Text>
              ) : (
                recentDecks.map(deck => (
                  <Card key={deck.id} withBorder component={Link} to={`/decks/${deck.id}`}>
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{deck.title}</Text>
                        <Text size="sm" c="dimmed">{deck.cardCount} cards</Text>
                      </div>
                      {deck.lastStudied && (
                        <Text size="sm" c="dimmed">
                          Last studied: {new Date(deck.lastStudied).toLocaleDateString()}
                        </Text>
                      )}
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Recent Tests */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md">
            <Group justify="space-between" mb="md">
              <Title order={3}>Recent Tests</Title>
              <Button component={Link} to="/tests" variant="light">View All</Button>
            </Group>
            <Stack gap="md">
              {recentTests.length === 0 ? (
                <Text c="dimmed">No tests taken yet</Text>
              ) : (
                recentTests.map(test => (
                  <Card key={test.id} withBorder>
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{test.title}</Text>
                        <Text size="sm" c="dimmed">
                          Score: {Math.round(test.score * 100)}%
                        </Text>
                      </div>
                      <Text size="sm" c="dimmed">
                        {new Date(test.completedAt).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
} 