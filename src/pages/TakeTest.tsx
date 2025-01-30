import * as Mantine from '@mantine/core';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

interface User {
  id: number;
  username: string;
}

interface Question {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'fill_in_the_blank' | 'matching';
  content: string;
  options?: {
    id: number;
    content: string;
    match_id?: number;
    is_term?: boolean;
  }[];
}

interface Test {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
}

interface Answer {
  questionId: number;
  answer: string;
}

interface MatchingPairs {
  [key: number]: number;
  selectedTerm?: number;
}

function TakeTest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [matchingPairs, setMatchingPairs] = useState<MatchingPairs>({});

  useEffect(() => {
    if (!id || !token) return;

    // Fetch test data
    fetch(`/api/tests/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setTest(data);
        setLoading(false);
      })
      .catch(error => {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to load test',
          color: 'red',
          icon: <IconX size={16} />
        });
        navigate('/tests');
      });
  }, [id, token, navigate]);

  const handleAnswer = (answer: string) => {
    if (!test) return;

    const question = test.questions[currentQuestionIndex];
    setAnswers(prev => {
      const newAnswers = [...prev];
      const existingIndex = newAnswers.findIndex(a => a.questionId === question.id);
      
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = { questionId: question.id, answer };
      } else {
        newAnswers.push({ questionId: question.id, answer });
      }
      
      return newAnswers;
    });

    // Move to next question if not the last one
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleMatchingPair = (sourceId: number, targetId: number) => {
    setMatchingPairs(prev => ({
      ...prev,
      [sourceId]: targetId
    }));

    // If all pairs are matched, create the answer string
    const matchingQuestion = test?.questions[currentQuestionIndex];
    if (matchingQuestion && Object.keys(matchingPairs).length === (matchingQuestion.options?.length || 0) / 2 - 1) {
      const answerString = Object.entries(matchingPairs)
        .map(([source, target]) => `${source}-${target}`)
        .join(',');
      handleAnswer(answerString);
    }
  };

  const handleSubmit = async () => {
    if (!test || !token) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/tests/${test.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      notifications.show({
        title: 'Success',
        message: 'Test submitted successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      // Navigate to results page
      navigate(`/tests/${test.id}/results`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to submit test',
        color: 'red',
        icon: <IconX size={16} />
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

  if (!test) {
    return (
      <Mantine.Container size="sm">
        <Mantine.Alert color="red" title="Error">
          Test not found
        </Mantine.Alert>
      </Mantine.Container>
    );
  }

  if (test.questions.length === 0) {
    return (
      <Mantine.Container size="sm">
        <Mantine.Alert color="blue" title="Test Setup">
          This test has no questions. Please contact your instructor.
        </Mantine.Alert>
      </Mantine.Container>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)?.answer;

  return (
    <Mantine.Container size="md">
      <Mantine.Paper shadow="sm" p="xl" withBorder>
        <Mantine.Title order={2} mb="xl">{test.title}</Mantine.Title>
        
        {/* Progress */}
        <Mantine.Progress 
          value={(currentQuestionIndex / (test.questions.length || 1)) * 100} 
          mb="xl"
          size="xl"
        >
          Question {currentQuestionIndex + 1} of {test.questions.length}
        </Mantine.Progress>

        {/* Question */}
        <Mantine.Card mb="xl">
          <Mantine.Text size="lg" mb="md">{currentQuestion.content}</Mantine.Text>

          {/* Question type specific UI */}
          {currentQuestion.type === 'multiple_choice' && (
            <Mantine.Stack>
              {currentQuestion.options?.map(option => (
                <Mantine.Button
                  key={option.id}
                  variant={currentAnswer === option.content ? 'filled' : 'light'}
                  onClick={() => handleAnswer(option.content)}
                  fullWidth
                >
                  {option.content}
                </Mantine.Button>
              ))}
            </Mantine.Stack>
          )}

          {currentQuestion.type === 'true_false' && (
            <Mantine.Group>
              <Mantine.Button
                variant={currentAnswer === 'true' ? 'filled' : 'light'}
                onClick={() => handleAnswer('true')}
              >
                True
              </Mantine.Button>
              <Mantine.Button
                variant={currentAnswer === 'false' ? 'filled' : 'light'}
                onClick={() => handleAnswer('false')}
              >
                False
              </Mantine.Button>
            </Mantine.Group>
          )}

          {currentQuestion.type === 'fill_in_the_blank' && (
            <Mantine.TextInput
              placeholder="Type your answer"
              value={currentAnswer || ''}
              onChange={(e) => handleAnswer(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleAnswer(e.currentTarget.value);
                }
              }}
            />
          )}

          {currentQuestion.type === 'matching' && currentQuestion.options && (
            <>
              <Mantine.Text mb="md">Click matching pairs or drag terms to their definitions:</Mantine.Text>
              <Mantine.Grid>
                <Mantine.Grid.Col span={6}>
                  <Mantine.Text fw={700} mb="sm">Terms</Mantine.Text>
                  {currentQuestion.options
                    .filter(opt => opt.is_term)
                    .map(option => (
                      <Mantine.Card
                        key={option.id}
                        shadow="sm"
                        mb="sm"
                        withBorder
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: matchingPairs[option.id] ? '#e6f7ff' : undefined
                        }}
                        onClick={() => {
                          // If this term is already matched, unmatch it
                          if (matchingPairs[option.id]) {
                            setMatchingPairs(prev => {
                              const { [option.id]: removed, ...rest } = prev;
                              return rest;
                            });
                          } else {
                            // Otherwise, store this term as the current selection
                            setMatchingPairs(prev => ({
                              ...prev,
                              selectedTerm: option.id
                            }));
                          }
                        }}
                      >
                        {option.content}
                      </Mantine.Card>
                    ))}
                </Mantine.Grid.Col>
                <Mantine.Grid.Col span={6}>
                  <Mantine.Text fw={700} mb="sm">Definitions</Mantine.Text>
                  {currentQuestion.options
                    .filter(opt => !opt.is_term)
                    .map(option => (
                      <Mantine.Card
                        key={option.id}
                        shadow="sm"
                        mb="sm"
                        withBorder
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: Object.values(matchingPairs).includes(option.id) ? '#e6f7ff' : undefined
                        }}
                        onClick={() => {
                          if (!currentQuestion.options) return;

                          // If there's a selected term, match it with this definition
                          if (matchingPairs.selectedTerm) {
                            const termId = matchingPairs.selectedTerm;
                            setMatchingPairs(prev => {
                              const { selectedTerm, ...rest } = prev;
                              return {
                                ...rest,
                                [termId]: option.id
                              };
                            });

                            // If all pairs are matched, submit the answer
                            const terms = currentQuestion.options.filter(opt => opt.is_term);
                            const matchCount = Object.keys(matchingPairs).length - 1; // -1 for selectedTerm
                            if (matchCount === terms.length - 1) {
                              const answerString = Object.entries(matchingPairs)
                                .filter(([key]) => key !== 'selectedTerm')
                                .map(([termId, defId]) => `${termId}-${defId}`)
                                .join(',');
                              handleAnswer(answerString);
                            }
                          }
                        }}
                      >
                        {option.content}
                      </Mantine.Card>
                    ))}
                </Mantine.Grid.Col>
              </Mantine.Grid>
            </>
          )}
        </Mantine.Card>

        {/* Navigation */}
        <Mantine.Group justify="space-between">
          <Mantine.Button
            variant="light"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          >
            Previous
          </Mantine.Button>

          {currentQuestionIndex === test.questions.length - 1 ? (
            <Mantine.Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={answers.length !== test.questions.length}
            >
              Submit Test
            </Mantine.Button>
          ) : (
            <Mantine.Button
              variant="light"
              disabled={currentQuestionIndex === test.questions.length - 1 || !currentAnswer}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            >
              Next
            </Mantine.Button>
          )}
        </Mantine.Group>
      </Mantine.Paper>
    </Mantine.Container>
  );
}

export default TakeTest; 
