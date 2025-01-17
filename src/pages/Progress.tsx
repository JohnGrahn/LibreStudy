import * as Mantine from '@mantine/core';

// Temporary mock data
const mockProgress = {
  totalCards: 275,
  masteredCards: 180,
  cardsToReview: 45,
  testsTaken: 12,
  averageScore: 88,
  recentScores: [85, 92, 78, 95, 88],
  decks: [
    { id: 1, title: 'Spanish Vocabulary', progress: 75 },
    { id: 2, title: 'JavaScript Basics', progress: 60 },
    { id: 3, title: 'World Capitals', progress: 85 },
  ]
};

function ProgressPage() {
  return (
    <Mantine.Container size="lg">
      <Mantine.Title order={2} mb="xl">My Progress</Mantine.Title>

      <Mantine.SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        <Mantine.Card shadow="sm" padding="lg" radius="md" withBorder>
          <Mantine.Title order={3} mb="md">Flashcards Progress</Mantine.Title>
          <Mantine.Group>
            <Mantine.RingProgress
              size={120}
              roundCaps
              thickness={8}
              sections={[
                { value: (mockProgress.masteredCards / mockProgress.totalCards) * 100, color: 'green' },
                { value: (mockProgress.cardsToReview / mockProgress.totalCards) * 100, color: 'yellow' },
              ]}
              label={
                <Mantine.Text ta="center" size="sm" fw={700}>
                  {Math.round((mockProgress.masteredCards / mockProgress.totalCards) * 100)}%
                </Mantine.Text>
              }
            />
            <div>
              <Mantine.Text size="sm">Total Cards: {mockProgress.totalCards}</Mantine.Text>
              <Mantine.Text size="sm" c="green">Mastered: {mockProgress.masteredCards}</Mantine.Text>
              <Mantine.Text size="sm" c="yellow">To Review: {mockProgress.cardsToReview}</Mantine.Text>
            </div>
          </Mantine.Group>
        </Mantine.Card>

        <Mantine.Card shadow="sm" padding="lg" radius="md" withBorder>
          <Mantine.Title order={3} mb="md">Test Performance</Mantine.Title>
          <Mantine.Text size="sm">Tests Taken: {mockProgress.testsTaken}</Mantine.Text>
          <Mantine.Text size="sm" mt="xs">Average Score: {mockProgress.averageScore}%</Mantine.Text>
          <Mantine.Text size="sm" mt="lg" mb="xs">Recent Scores:</Mantine.Text>
          <Mantine.Group gap="xs">
            {mockProgress.recentScores.map((score, index) => (
              <Mantine.Badge 
                key={index}
                color={score >= 70 ? 'green' : 'red'}
              >
                {score}%
              </Mantine.Badge>
            ))}
          </Mantine.Group>
        </Mantine.Card>

        <Mantine.Card shadow="sm" padding="lg" radius="md" withBorder>
          <Mantine.Title order={3} mb="md">Deck Progress</Mantine.Title>
          {mockProgress.decks.map(deck => (
            <Mantine.Box key={deck.id} mb="sm">
              <Mantine.Group justify="space-between" mb="xs">
                <Mantine.Text size="sm">{deck.title}</Mantine.Text>
                <Mantine.Text size="sm">{deck.progress}%</Mantine.Text>
              </Mantine.Group>
              <Mantine.Progress 
                value={deck.progress}
                color={deck.progress >= 70 ? 'green' : deck.progress >= 40 ? 'yellow' : 'red'}
                size="sm"
              />
            </Mantine.Box>
          ))}
        </Mantine.Card>
      </Mantine.SimpleGrid>
    </Mantine.Container>
  );
}

export default ProgressPage; 