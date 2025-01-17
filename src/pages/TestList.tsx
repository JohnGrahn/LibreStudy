import * as Mantine from '@mantine/core';
import { IconSearch } from '../components/Icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Test {
  id: number;
  title: string;
  questionCount: number;
  description: string;
  completed: boolean;
  score?: number;
}

// Temporary mock data
const mockTests: Test[] = [
  { 
    id: 1, 
    title: 'Spanish Vocabulary Quiz', 
    questionCount: 20, 
    description: 'Test your knowledge of basic Spanish vocabulary',
    completed: true,
    score: 85
  },
  { 
    id: 2, 
    title: 'JavaScript Fundamentals', 
    questionCount: 15, 
    description: 'Test your JavaScript basics',
    completed: false
  },
  { 
    id: 3, 
    title: 'World Capitals Challenge', 
    questionCount: 25, 
    description: 'Test your knowledge of world capitals',
    completed: true,
    score: 92
  },
];

function TestList() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTests = mockTests.filter(test => 
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {test.questionCount} questions
            </Mantine.Text>
            
            <Mantine.Text mt="xs">
              {test.description}
            </Mantine.Text>

            <Mantine.Group mt="md">
              <Mantine.Button 
                component={Link} 
                to={`/tests/${test.id}`} 
                variant="light"
              >
                View Details
              </Mantine.Button>
              {!test.completed && (
                <Mantine.Button 
                  component={Link} 
                  to={`/tests/${test.id}/take`} 
                  variant="filled"
                >
                  Take Test
                </Mantine.Button>
              )}
            </Mantine.Group>
          </Mantine.Card>
        ))}
      </Mantine.SimpleGrid>
    </Mantine.Container>
  );
}

export default TestList; 