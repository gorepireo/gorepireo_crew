import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { LoginPage } from './pages/auth/LoginPage';
import { AdminLayout } from './layouts/AdminLayout';
import { LeaderLayout } from './layouts/LeaderLayout';
import { WorkerLayout } from './layouts/WorkerLayout';

// Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminWorkers } from './pages/admin/AdminWorkers';
import { AdminLeaders } from './pages/admin/AdminLeaders';
import { AdminTeams } from './pages/admin/AdminTeams';
import { AdminAssignments } from './pages/admin/AdminAssignments';
import { AdminLocations } from './pages/admin/AdminLocations';
import { AdminAttendance } from './pages/admin/AdminAttendance';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminActivityLogs } from './pages/admin/AdminActivityLogs';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminEvidence } from './pages/admin/AdminEvidence';
import { AdminB2BManagement } from './pages/admin/AdminB2BManagement';

// Client Portal Pages
import { ClientLayout } from './layouts/ClientLayout';
import { ClientOverview } from './pages/client/ClientOverview';
import { ClientEvents } from './pages/client/ClientEvents';
import { ClientInvoices } from './pages/client/ClientInvoices';
import { ClientReceipts } from './pages/client/ClientReceipts';
import { ClientProfile } from './pages/client/ClientProfile';

// Team Leader Pages
import { LeaderDashboard } from './pages/leader/LeaderDashboard';
import { LeaderTeams } from './pages/leader/LeaderTeams';
import { LeaderAddWorker } from './pages/leader/LeaderAddWorker';
import { LeaderAssignWork } from './pages/leader/LeaderAssignWork';
import { LeaderLocations } from './pages/leader/LeaderLocations';
import { LeaderAttendance } from './pages/leader/LeaderAttendance';
import { LeaderMonitoring } from './pages/leader/LeaderMonitoring';
import { LeaderReports } from './pages/leader/LeaderReports';
import { LeaderEvidence } from './pages/leader/LeaderEvidence';
import { LeaderProfile } from './pages/leader/LeaderProfile';
import { LeaderSettings } from './pages/leader/LeaderSettings';

// Worker Pages
import { WorkerHome } from './pages/worker/WorkerHome';
import { WorkerWork } from './pages/worker/WorkerWork';
import { WorkerAttendance } from './pages/worker/WorkerAttendance';
import { WorkerProfile } from './pages/worker/WorkerProfile';

import { UserRole } from './types';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[CRITICAL] Uncaught application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold mb-2">Go_Repireo Crew</h1>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            An unexpected error occurred while loading this page. Click below to refresh or return to login.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition"
            >
              Reset Session & Log In
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Guard with Direct Role Auto-Activation for Address Bar Direct Access
const ProtectedRoute: React.FC<{
  allowedRoles: UserRole[];
  targetRole?: UserRole;
  children: React.ReactElement;
}> = ({ allowedRoles, targetRole, children }) => {
  const { user, role, loading, switchRole } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);
  const attemptedSwitchRef = React.useRef(false);

  useEffect(() => {
    // Only attempt role switch if user is already logged in and needs role switch
    if (!loading && user && targetRole && role !== targetRole && !attemptedSwitchRef.current) {
      attemptedSwitchRef.current = true;
      setIsSwitching(true);
      switchRole(targetRole).finally(() => {
        setIsSwitching(false);
      });
    }
  }, [loading, role, targetRole, user, switchRole]);

  if (loading || isSwitching) {
    return (
      <LoadingSpinner
        fullScreen
        message={targetRole === 'ADMIN' ? 'Opening Admin Console...' : 'Opening Go_Repireo Crew...'}
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (targetRole && role === targetRole) {
    return children;
  }

  if (!allowedRoles.includes(role)) {
    // Redirect to user's assigned interface
    const redirectUrl =
      role === 'ADMIN'
        ? '/admin/dashboard'
        : role === 'TEAM_LEADER'
        ? '/leader/dashboard'
        : role === 'B2B_CLIENT'
        ? '/client/overview'
        : '/worker/home';
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
};

// Root index redirector
const RootRedirect: React.FC = () => {
  const { role, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Preparing workspace..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'TEAM_LEADER') return <Navigate to="/leader/dashboard" replace />;
  if (role === 'B2B_CLIENT') return <Navigate to="/client/overview" replace />;
  return <Navigate to="/worker/home" replace />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <HashRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* ADMIN INTERFACE (Direct Address Bar Access Supported) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']} targetRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminOverview />} />
              <Route path="workers" element={<AdminWorkers />} />
              <Route path="leaders" element={<AdminLeaders />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="assignments" element={<AdminAssignments />} />
              <Route path="b2b" element={<AdminB2BManagement />} />
              <Route path="locations" element={<AdminLocations />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="evidence" element={<AdminEvidence />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="activity-logs" element={<AdminActivityLogs />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* TEAM LEADER INTERFACE */}
            <Route
              path="/leader"
              element={
                <ProtectedRoute allowedRoles={['TEAM_LEADER']} targetRole="TEAM_LEADER">
                  <LeaderLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/leader/dashboard" replace />} />
              <Route path="dashboard" element={<LeaderDashboard />} />
              <Route path="teams" element={<LeaderTeams />} />
              <Route path="add-worker" element={<LeaderAddWorker />} />
              <Route path="assign-work" element={<LeaderAssignWork />} />
              <Route path="locations" element={<LeaderLocations />} />
              <Route path="attendance" element={<LeaderAttendance />} />
              <Route path="evidence" element={<LeaderEvidence />} />
              <Route path="work-monitoring" element={<LeaderMonitoring />} />
              <Route path="reports" element={<LeaderReports />} />
              <Route path="profile" element={<LeaderProfile />} />
              <Route path="settings" element={<LeaderSettings />} />
            </Route>

            {/* WORKER INTERFACE (MOBILE-FIRST) */}
            <Route
              path="/worker"
              element={
                <ProtectedRoute allowedRoles={['WORKER', 'ADMIN', 'TEAM_LEADER']}>
                  <WorkerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/worker/home" replace />} />
              <Route path="home" element={<WorkerHome />} />
              <Route path="work" element={<WorkerWork />} />
              <Route path="attendance" element={<WorkerAttendance />} />
              <Route path="profile" element={<WorkerProfile />} />
            </Route>

            {/* B2B CLIENT INTERFACE */}
            <Route
              path="/client"
              element={
                <ProtectedRoute allowedRoles={['B2B_CLIENT', 'ADMIN']} targetRole="B2B_CLIENT">
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/client/overview" replace />} />
              <Route path="overview" element={<ClientOverview />} />
              <Route path="events" element={<ClientEvents />} />
              <Route path="invoices" element={<ClientInvoices />} />
              <Route path="receipts" element={<ClientReceipts />} />
              <Route path="profile" element={<ClientProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </LanguageProvider>
    </AuthProvider>
  </ErrorBoundary>
  );
};

export default App;
