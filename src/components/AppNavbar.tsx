import { NavLink } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconDashboard, IconCards, IconNotes, IconChartBar } from './Icons';
import { useAuth } from '../contexts/AuthContext';

export function AppNavbar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const pathname = location.pathname;

  // Don't show navbar on login/register pages
  if (!isAuthenticated || ['/login', '/register'].includes(pathname)) {
    return null;
  }

  return (
    <nav>
      <NavLink
        component={Link}
        to="/"
        label="Dashboard"
        leftSection={<IconDashboard size="1.2rem" />}
        active={pathname === '/'}
      />
      <NavLink
        component={Link}
        to="/decks"
        label="Decks"
        leftSection={<IconCards size="1.2rem" />}
        active={pathname.startsWith('/decks')}
      />
      <NavLink
        component={Link}
        to="/tests"
        label="Tests"
        leftSection={<IconNotes size="1.2rem" />}
        active={pathname.startsWith('/tests')}
      />
      <NavLink
        component={Link}
        to="/progress"
        label="Progress"
        leftSection={<IconChartBar size="1.2rem" />}
        active={pathname.startsWith('/progress')}
      />
    </nav>
  );
} 