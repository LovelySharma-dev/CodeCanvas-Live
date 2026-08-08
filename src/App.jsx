import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import WorkspaceStudio from './pages/WorkspaceStudio';
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import ProfilePage from './pages/ProfilePage';
import { Sparkles } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-bg flex flex-col items-center justify-center text-slate-400">
        <Sparkles className="w-8 h-8 text-brand-primary animate-spin mb-2" />
        <p className="text-xs font-semibold">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/workspace/:workspaceId" element={
            <ProtectedRoute>
              <WorkspaceStudio />
            </ProtectedRoute>
          } />

          <Route path="/workspace/:workspaceId/settings" element={
            <ProtectedRoute>
              <WorkspaceSettingsPage />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/invite/:token" element={<AcceptInvitePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
