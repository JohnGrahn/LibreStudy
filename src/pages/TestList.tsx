import * as Mantine from '@mantine/core';
import { IconSearch } from '../components/Icons';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import api from '../lib/api';

interface Test {
  id: number;
  title: string;
  question_count: number;
  description: string;
  completed: boolean;
  score?: number;
}

function TestList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const data = await api('/tests');
      setTests(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to load tests',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredTests = tests.filter(test => 
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Mantine.Center h="100vh">
        <Mantine.Loader size="xl" />
      </Mantine.Center>
    );
  }

  return (
    <Mantine.Container size="lg">
      <Mantine.Group justify="space-between" mb="xl">
        <Mantine.Title order={2}>My Tests</Mantine.Title>
        <Mantine.Button component={Link} to="/tests/new">Create New Test</Mantine.Button>
      </Mantine.Group>

      <Mantine.TextInput
        placeholder="Search tests..."
        mb="lg"
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
      />

      {filteredTests.length === 0 ? (
        <Mantine.Paper p="xl" withBorder>
          <Mantine.Text ta="center" c="dimmed">
            {searchQuery ? 'No tests match your search.' : 'No tests yet. Create your first test to get started!'}
          </Mantine.Text>
        </Mantine.Paper>
      ) : (
        <Mantine.SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {filteredTests.map(test => (
            <Mantine.Card key={test.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Mantine.Card.Section withBorder inheritPadding py="xs">
                <Mantine.Group justify="space-between">
                  <Mantine.Title order={3}>{test.title}</Mantine.Title>
                  {test.completed && test.score !== undefined && (
                    <Mantine.Badge color={test.score >= 70 ? 'green' : 'red'}>
                      {test.score}%
                    </Mantine.Badge>
                  )}
                </Mantine.Group>
              </Mantine.Card.Section>
              
              <Mantine.Text mt="md" size="sm" c="dimmed">
                {test.question_count} questions
              </Mantine.Text>
              
              <Mantine.Text mt="xs">
                {test.description}
              </Mantine.Text>

              <Mantine.Group mt="md">
                {!test.completed && (
                  <Mantine.Button 
                    component={Link} 
                    to={`/tests/${test.id}/take`} 
                    variant="filled"
                  >
                    Take Test
                  </Mantine.Button>
                )}
                {test.completed && (
                  <Mantine.Button 
                    component={Link} 
                    to={`/tests/${test.id}/results`} 
                    variant="light"
                  >
                    View Results
                  </Mantine.Button>
                )}
              </Mantine.Group>
            </Mantine.Card>
          ))}
        </Mantine.SimpleGrid>
      )}
    </Mantine.Container>
  );
}

export default TestList; 