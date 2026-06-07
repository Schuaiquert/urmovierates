'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/services/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<User>;
  forgotPassword: (email: string) => Promise<unknown>;
  resetPassword: (token: string, password: string) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try { setUser(JSON.parse(saved) as User); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setUser(data.data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await authAPI.register({ name, email, password });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const deleteAccount = useCallback(async () => {
    await authAPI.deleteMe();
    logout();
  }, [logout]);

  const updateUser = useCallback(async (data: Partial<User>) => {
    const { data: res } = await authAPI.updateMe(data);
    localStorage.setItem('user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  }, []);

  const forgotPassword = useCallback((email: string) => authAPI.forgotPassword({ email }), []);
  const resetPassword = useCallback((token: string, password: string) =>
    authAPI.resetPassword({ token, password }), []);

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated: !!user,
      login, register, logout, deleteAccount, updateUser,
      forgotPassword, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
