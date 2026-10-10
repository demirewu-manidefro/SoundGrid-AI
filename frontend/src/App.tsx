import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

import { Landing } from './pages/Landing';
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
      <div className="flex min-h-screen items-center justify-center bg-[#070A12] bg-radial-mesh">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 text-cyan-400 animate-spin" />
          <p className="font-mono text-xs tracking-wider text-slate-400 uppercase">
            Synchronizing Industrial Telemetry Cluster...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#070A12] text-white selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#070A12] bg-radial-mesh">
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
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
        />
        <Route
          path="/dashboard"
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
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
