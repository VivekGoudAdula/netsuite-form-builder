import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BuilderPage from './pages/BuilderPage';
import PreviewPage from './pages/PreviewPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import FormFillPage from './pages/FormFillPage';
import AdminSubmissionsPage from './pages/AdminSubmissionsPage';
import { useStore } from './store/useStore';
import { UserRole } from './types';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: UserRole }) {
  const user = useStore((state) => state.user);
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/customer-dashboard'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute role="admin">
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/companies" 
          element={
            <ProtectedRoute role="admin">
              <CompaniesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/companies/:id" 
          element={
            <ProtectedRoute role="admin">
              <CompanyDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/submissions" 
          element={
            <ProtectedRoute role="admin">
              <AdminSubmissionsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/builder" 
          element={
            <ProtectedRoute role="admin">
              <BuilderPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/preview" 
          element={
            <ProtectedRoute role="admin">
              <PreviewPage />
            </ProtectedRoute>
          } 
        />

        {/* Customer Routes */}
        <Route 
          path="/customer-dashboard" 
          element={
            <ProtectedRoute role="customer">
              <CustomerDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fill/:id" 
          element={
            <ProtectedRoute role="customer">
              <FormFillPage />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
