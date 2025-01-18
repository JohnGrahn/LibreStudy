import { Routes, Route, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LoadingOverlay } from '@mantine/core';

// Lazy load all pages
const Dashboard = lazy(() => import('../pages/Dashboard'));
const DeckList = lazy(() => import('../pages/DeckList'));
const DeckView = lazy(() => import('../pages/DeckView'));
const CreateDeck = lazy(() => import('../pages/CreateDeck'));
const StudyMode = lazy(() => import('../pages/StudyMode'));
const TestList = lazy(() => import('../pages/TestList'));
const ProgressPage = lazy(() => import('../pages/Progress'));

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/decks" element={<Outlet />}>
          <Route index element={<DeckList />} />
          <Route path="new" element={<CreateDeck />} />
          <Route path=":id" element={<DeckView />} />
          <Route path=":id/study" element={<StudyMode />} />
        </Route>
        <Route path="/tests/*" element={<TestList />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Routes>
    </Suspense>
  );
} 