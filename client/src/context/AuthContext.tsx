import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Worker, TeamLeader, UserRole, OrganizationSettings } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  worker: Worker | null;
  leader: TeamLeader | null;
  settings: OrganizationSettings | null;
  loading: boolean;
  mustChangePassword: boolean;
  login: (identifier: string, password?: string, role?: UserRole) => Promise<{ redirectUrl: string; mustChangePassword?: boolean }>;
  registerWorker: (data: { name: string; phone: string; password: string; email?: string; role?: 'WORKER' | 'TEAM_LEADER' }) => Promise<{ redirectUrl: string }>;
  logout: () => void;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
  updateProfilePhoto: (photoBase64: string) => Promise<{ photoURL: string; deletedPrevious: boolean }>;
  switchRole: (newRole: UserRole, targetUserId?: string) => Promise<string>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('workcrew_role') as UserRole) || 'ADMIN';
  });
  const [worker, setWorker] = useState<Worker | null>(null);
  const [leader, setLeader] = useState<TeamLeader | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    const token = localStorage.getItem('workcrew_token');
    if (!token) {
      setUser(null);
      setWorker(null);
      setLeader(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getMe();
      setUser(res.user);
      setRole(res.user.role);
      setWorker(res.worker || null);
      setLeader(res.leader || null);
      setSettings(res.settings);
      setMustChangePassword(!!res.user.mustChangePassword);
      localStorage.setItem('workcrew_role', res.user.role);
      localStorage.setItem('workcrew_userId', res.user.uid);
    } catch (e) {
      console.error('Session expired or invalid', e);
      localStorage.removeItem('workcrew_token');
      localStorage.removeItem('workcrew_role');
      localStorage.removeItem('workcrew_userId');
      setUser(null);
      setWorker(null);
      setLeader(null);
      setMustChangePassword(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
    api.getSettings().then(setSettings).catch((err) => {
      console.warn('Could not load public org settings on startup:', err.message);
    });
  }, []);

  const login = async (identifier: string, password?: string, role?: UserRole) => {
    const res = await api.login(identifier, password, role);
    setUser(res.user);
    setRole(res.user.role);
    setWorker(res.worker || null);
    setLeader(res.leader || null);
    setMustChangePassword(!!res.mustChangePassword || !!res.user.mustChangePassword);
    localStorage.setItem('workcrew_token', res.token);
    localStorage.setItem('workcrew_role', res.user.role);
    localStorage.setItem('workcrew_userId', res.user.uid);
    return { redirectUrl: res.redirectUrl, mustChangePassword: !!res.mustChangePassword };
  };

  const registerWorker = async (data: { name: string; phone: string; password: string; email?: string; role?: 'WORKER' | 'TEAM_LEADER' }) => {
    const res = await api.registerWorker(data);
    setUser(res.user);
    setRole(res.user.role);
    setWorker(res.worker || null);
    setLeader(res.leader || null);
    setMustChangePassword(false);
    localStorage.setItem('workcrew_token', res.token);
    localStorage.setItem('workcrew_role', res.user.role);
    localStorage.setItem('workcrew_userId', res.user.uid);
    return { redirectUrl: res.redirectUrl };
  };

  const changePassword = async (newPassword: string, currentPassword?: string) => {
    const res = await api.changePassword(newPassword, currentPassword);
    setUser(res.user);
    setMustChangePassword(false);
  };

  const updateProfilePhoto = async (photoBase64: string): Promise<{ photoURL: string; deletedPrevious: boolean }> => {
    const res = await api.updateProfilePhoto(photoBase64);
    if (res.user) setUser(res.user);
    if (res.worker) setWorker(res.worker);
    if (res.leader) setLeader(res.leader);
    return { photoURL: res.photoURL, deletedPrevious: res.deletedPrevious };
  };

  const logout = () => {
    localStorage.removeItem('workcrew_token');
    localStorage.removeItem('workcrew_role');
    localStorage.removeItem('workcrew_userId');
    setUser(null);
    setWorker(null);
    setLeader(null);
    setMustChangePassword(false);
  };

  const switchRole = async (newRole: UserRole, targetUserId?: string): Promise<string> => {
    setLoading(true);
    try {
      const res = await api.switchRole(newRole, targetUserId);
      setUser(res.user);
      setRole(res.user.role);
      setWorker(res.worker || null);
      setLeader(res.leader || null);
      setMustChangePassword(!!res.user.mustChangePassword);
      localStorage.setItem('workcrew_token', res.token);
      localStorage.setItem('workcrew_role', res.user.role);
      localStorage.setItem('workcrew_userId', res.user.uid);
      return res.redirectUrl;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        worker,
        leader,
        settings,
        loading,
        mustChangePassword,
        login,
        registerWorker,
        logout,
        changePassword,
        updateProfilePhoto,
        switchRole,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
