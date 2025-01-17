import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LoadingOverlay } from '@mantine/core';

// Lazy load all pages
const Dashboard = lazy(() => import('../pages/Dashboard'));
const DeckList = lazy(() => import('../pages/DeckList'));
const TestList = lazy(() => import('../pages/TestList'));
const ProgressPage = lazy(() => import('../pages/Progress'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/decks/*" element={<DeckList />} />
        <Route path="/tests/*" element={<TestList />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Routes>
    </Suspense>
  );
} 