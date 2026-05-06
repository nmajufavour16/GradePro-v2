import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { DataProvider } from '@/src/contexts/DataContext';
import Layout from '@/src/components/Layout';
import Landing from '@/src/pages/Landing';
import Dashboard from '@/src/pages/Dashboard';
import Semesters from '@/src/pages/Semesters';
import SemesterDetail from '@/src/pages/SemesterDetail';
import Report from '@/src/pages/Report';
import Onboarding from '@/src/pages/Onboarding';
import AIChat from '@/src/pages/AIChat';
import Settings from '@/src/pages/Settings';
import CourseLibrary from '@/src/pages/CourseLibrary';
import AdminDashboard from '@/src/pages/AdminDashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Check if onboarding is required
  const needsOnboarding = !profile?.institution || !profile?.faculty || !profile?.department || !profile?.level;
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (!needsOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/semesters" element={<Semesters />} />
              <Route path="/semesters/:id" element={<SemesterDetail />} />
              <Route path="/report" element={<Report />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/library" element={<CourseLibrary />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
