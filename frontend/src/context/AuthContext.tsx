import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  quickDemoLogin: (role: 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'SAFETY_MANAGER' | 'TECHNICIAN' | 'AUDITOR') => Promise<void>;
  logout: () => void;
}

const DEMO_CREDENTIALS: Record<string, { email: string; pass: string }> = {
  SUPER_ADMIN: { email: 'superadmin@soundgrid.ai', pass: 'Password123!' },
  ENTERPRISE_ADMIN: { email: 'admin@apexpower.com', pass: 'Password123!' },
  SAFETY_MANAGER: { email: 'safety@apexpower.com', pass: 'Password123!' },
  TECHNICIAN: { email: 'tech@apexpower.com', pass: 'Password123!' },
  AUDITOR: { email: 'auditor@apexpower.com', pass: 'Password123!' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('soundgrid_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.auth.me();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.accessToken) {
      localStorage.setItem('soundgrid_access_token', res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await api.auth.google(idToken);
    if (res.success && res.accessToken) {
      localStorage.setItem('soundgrid_access_token', res.accessToken);
      setToken(res.accessToken);
      setUser(res.user);
    }
  };

  const quickDemoLogin = async (role: 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'SAFETY_MANAGER' | 'TECHNICIAN' | 'AUDITOR') => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const logout = () => {
    localStorage.removeItem('soundgrid_access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithGoogle, quickDemoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
