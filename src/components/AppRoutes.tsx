import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LoadingOverlay } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';

// Lazy load all pages
const Dashboard = lazy(() => import('../pages/Dashboard'));
const DeckList = lazy(() => import('../pages/DeckList'));
const DeckView = lazy(() => import('../pages/DeckView'));
const CreateDeck = lazy(() => import('../pages/CreateDeck'));
const StudyMode = lazy(() => import('../pages/StudyMode'));
const TestList = lazy(() => import('../pages/TestList'));
const ProgressPage = lazy(() => import('../pages/Progress'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const DeckProgress = lazy(() => import('../pages/DeckProgress'));

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingOverlay visible={true} />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/decks" element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }>
          <Route index element={<DeckList />} />
          <Route path="new" element={<CreateDeck />} />
          <Route path=":id" element={<DeckView />} />
          <Route path=":id/study" element={<StudyMode />} />
          <Route path=":id/progress" element={<DeckProgress />} />
        </Route>

        <Route path="/tests/*" element={
          <ProtectedRoute>
            <TestList />
          </ProtectedRoute>
        } />

        <Route path="/progress" element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );
} 