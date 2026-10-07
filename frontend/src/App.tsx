import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TechnicianPage } from './pages/TechnicianPage';
import { MachinesPage } from './pages/MachinesPage';
import { SafetyTicketsPage } from './pages/SafetyTicketsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { AuditorPage } from './pages/AuditorPage';
import { UsersPage } from './pages/UsersPage';
import { Activity } from 'lucide-react';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="font-mono text-xs tracking-wider text-slate-400 uppercase">
            Synchronizing Industrial Telemetry Cluster...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F19] text-white">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0B0F19] bg-grid-pattern">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/diagnostics"
          element={
            <ProtectedLayout>
              <TechnicianPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/machines"
          element={
            <ProtectedLayout>
              <MachinesPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/tickets"
          element={
            <ProtectedLayout>
              <SafetyTicketsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedLayout>
              <AuditorPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/tenants"
          element={
            <ProtectedLayout>
              <SuperAdminPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedLayout>
              <UsersPage />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
