import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import { AppRoutes } from './components/AppRoutes';
import { AppNavbar } from './components/AppNavbar';
import { Header } from './components/Header';
import { AuthProvider } from './contexts/AuthContext';

function AppLayout() {
  const [opened, { toggle }] = useDisclosure();

  return (
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
        <Header opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppNavbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <AppRoutes />
      </AppShell.Main>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MantineProvider>
          <Notifications />
          <AppLayout />
        </MantineProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
