import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import StudentPage from '@/pages/StudentPage';
import AdminPage from '@/pages/AdminPage';
import GatePage from '@/pages/GatePage';
import LoginPage from '@/pages/LoginPage';
import StudentLoginPage from '@/pages/StudentLoginPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/gate" element={<GatePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/student" element={<StudentLoginPage />} />
          <Route path="/login/admin" element={<AdminLoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
