import * as Mantine from '@mantine/core';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';
import { IconX, IconCheck, IconArrowLeft } from '@tabler/icons-react';

interface TestResult {
  total_questions: number;
  correct_answers: number;
  score: number;
  answers: Array<{
    question_id: number;
    is_correct: boolean;
    user_answer: string;
    correct_answer: string;
  }>;
}

function TestResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [results, setResults] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) return;

    fetch(`/api/tests/${id}/results`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setResults(data);
        setLoading(false);
      })
      .catch(error => {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to load test results',
          color: 'red',
          icon: <IconX size={16} />
        });
        navigate('/tests');
      });
  }, [id, token, navigate]);

  if (loading) {
    return (
      <Mantine.Center h="100vh">
        <Mantine.Loader size="xl" />
      </Mantine.Center>
    );
  }

  if (!results) {
    return (
      <Mantine.Container size="sm">
        <Mantine.Alert color="red" title="Error">
          Test results not found
        </Mantine.Alert>
      </Mantine.Container>
    );
  }

  const scoreColor = results.score >= 70 ? 'green' : 'red';

  return (
    <Mantine.Container size="md">
      <Mantine.Group mb="xl">
        <Mantine.Button
          component={Link}
          to="/tests"
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
        >
          Back to Tests
        </Mantine.Button>
      </Mantine.Group>

      <Mantine.Paper shadow="sm" p="xl" withBorder>
        <Mantine.Stack>
          {/* Score Overview */}
          <Mantine.Card>
            <Mantine.Group justify="center" gap="xl">
              <Mantine.RingProgress
                size={160}
                thickness={16}
                roundCaps
                sections={[{ value: results.score, color: scoreColor }]}
                label={
                  <Mantine.Text ta="center" fz="xl" fw={700}>
                    {results.score}%
                  </Mantine.Text>
                }
              />
              
              <Mantine.Stack gap="xs">
                <Mantine.Text size="lg">
                  Correct Answers: {results.correct_answers} / {results.total_questions}
                </Mantine.Text>
                <Mantine.Badge 
                  size="xl" 
                  color={scoreColor}
                >
                  {results.score >= 70 ? 'Passed' : 'Failed'}
                </Mantine.Badge>
              </Mantine.Stack>
            </Mantine.Group>
          </Mantine.Card>

          {/* Detailed Results */}
          <Mantine.Card>
            <Mantine.Title order={3} mb="md">Detailed Results</Mantine.Title>
            
            <Mantine.Stack>
              {results.answers.map((answer, index) => (
                <Mantine.Paper 
                  key={answer.question_id} 
                  p="md" 
                  withBorder
                  bg={answer.is_correct ? 'green.0' : 'red.0'}
                >
                  <Mantine.Group justify="space-between" mb="xs">
                    <Mantine.Text fw={500}>Question {index + 1}</Mantine.Text>
                    {answer.is_correct ? (
                      <Mantine.Badge color="green" leftSection={<IconCheck size={14} />}>
                        Correct
                      </Mantine.Badge>
                    ) : (
                      <Mantine.Badge color="red" leftSection={<IconX size={14} />}>
                        Incorrect
                      </Mantine.Badge>
                    )}
                  </Mantine.Group>

                  <Mantine.Stack gap="xs">
                    <Mantine.Text>
                      Your Answer: {answer.user_answer}
                    </Mantine.Text>
                    {!answer.is_correct && (
                      <Mantine.Text c="dimmed">
                        Correct Answer: {answer.correct_answer}
                      </Mantine.Text>
                    )}
                  </Mantine.Stack>
                </Mantine.Paper>
              ))}
            </Mantine.Stack>
          </Mantine.Card>
        </Mantine.Stack>
      </Mantine.Paper>
    </Mantine.Container>
  );
}

export default TestResults; 