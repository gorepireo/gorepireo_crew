import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
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

// Protected Route Guard with Direct Role Auto-Activation for Address Bar Direct Access
const ProtectedRoute: React.FC<{
  allowedRoles: UserRole[];
  targetRole?: UserRole;
  children: React.ReactElement;
}> = ({ allowedRoles, targetRole, children }) => {
  const { user, role, loading, switchRole } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    // If user writes /admin in address bar, directly activate and switch to ADMIN session
    if (!loading && targetRole && (role !== targetRole || !user)) {
      setIsSwitching(true);
      switchRole(targetRole).finally(() => {
        setIsSwitching(false);
      });
    }
  }, [loading, role, targetRole, user]);

  if (loading || isSwitching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Opening {targetRole === 'ADMIN' ? 'Admin Console' : 'Go_Repireo Crew'}...</span>
        </div>
      </div>
    );
  }

  if (!user && !targetRole) {
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
        : '/worker/home';
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
};

// Root index redirector
const RootRedirect: React.FC = () => {
  const { role, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs font-semibold">
        Loading WorkCrew...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'TEAM_LEADER') return <Navigate to="/leader/dashboard" replace />;
  return <Navigate to="/worker/home" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </AuthProvider>
  );
};

export default App;
