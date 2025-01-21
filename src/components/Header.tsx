import { Group, Title, Button, Burger } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export function Header({ opened, toggle }: HeaderProps) {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // Don't show header on login/register pages
  if (!isAuthenticated || ['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <Title order={1} size="h3">LibreStudy</Title>
      </Group>
      <Button onClick={logout} variant="subtle">
        Logout
      </Button>
    </Group>
  );
} 