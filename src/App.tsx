import { AppShell, Burger, Group, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppNavbar } from './components/AppNavbar.tsx';
import { AppRoutes } from './components/AppRoutes.tsx';

export default function App() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <Router>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened }
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={1} size="h3">LibreStudy</Title>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <AppNavbar />
        </AppShell.Navbar>

        <AppShell.Main>
          <AppRoutes />
        </AppShell.Main>
      </AppShell>
    </Router>
  );
}
