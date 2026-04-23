import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FormsPage from './pages/FormsPage';
import BuilderPage from './pages/BuilderPage';
import PreviewPage from './pages/PreviewPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import WorkflowManagementPage from './pages/WorkflowManagementPage';
import TemplatesPage from './pages/TemplatesPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import FormFillPage from './pages/FormFillPage';
import AdminSubmissionsPage from './pages/AdminSubmissionsPage';
import CataloguePage from './pages/CataloguePage';
import UserTransactionHub from './pages/UserTransactionHub';
import StaffManagementPage from './pages/StaffManagementPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { useStore } from './store/useStore';
import { UserRole } from './types';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const user = useStore((state) => state.user);
  if (!user) return <Navigate to="/" replace />;
  
  // Super Admin can access everything
  if (user.role === 'super_admin') return <>{children}</>;
  
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'client_admin') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/customer-dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const restoreSession = useStore((state) => state.restoreSession);

  React.useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Shared Dashboard for Admins */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute roles={['super_admin', 'client_admin']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Super Admin Only */}
        <Route 
          path="/companies" 
          element={
            <ProtectedRoute roles={['super_admin']}>
              <CompaniesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/companies/:id" 
          element={
            <ProtectedRoute roles={['super_admin']}>
              <CompanyDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute roles={['super_admin']}>
              <StaffManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/forms" 
          element={
            <ProtectedRoute roles={['super_admin']}>
              <FormsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/templates" 
          element={
            <ProtectedRoute roles={['super_admin']}>
              <TemplatesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/catalogue/:type" 
          element={
            <ProtectedRoute roles={['super_admin']}>
              <CataloguePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/builder" 
          element={
            <ProtectedRoute roles={['super_admin']}>
              <BuilderPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/preview" 
          element={
            <ProtectedRoute roles={['super_admin']}>
              <PreviewPage />
            </ProtectedRoute>
          } 
        />

        {/* Client Admin & Higher */}
        <Route 
          path="/employees" 
          element={
            <ProtectedRoute roles={['client_admin', 'super_admin']}>
              <StaffManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/assign-forms" 
          element={
            <ProtectedRoute roles={['client_admin']}>
              <FormsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/workflow" 
          element={
            <ProtectedRoute roles={['client_admin']}>
              <WorkflowManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/companies/:companyId/workflow" 
          element={
            <ProtectedRoute roles={['super_admin', 'client_admin']}>
              <WorkflowManagementPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/submissions" 
          element={
            <ProtectedRoute roles={['super_admin', 'client_admin']}>
              <AdminSubmissionsPage />
            </ProtectedRoute>
          } 
        />

        {/* All Users / Common */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute roles={['super_admin', 'client_admin', 'manager', 'user']}>
              <ProfileSettingsPage />
            </ProtectedRoute>
          } 
        />

        {/* User Specific */}
        <Route 
          path="/customer-dashboard" 
          element={
            <ProtectedRoute roles={['user', 'manager']}>
              <CustomerDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user/:type" 
          element={
            <ProtectedRoute roles={['user', 'manager']}>
              <UserTransactionHub />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/fill/:id" 
          element={
            <ProtectedRoute roles={['user', 'manager']}>
              <FormFillPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/user/forms/:id/new" 
          element={
            <ProtectedRoute roles={['user', 'manager']}>
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
