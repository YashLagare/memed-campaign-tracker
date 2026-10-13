'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api';

export type UserRole = 'brand' | 'creator';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('memed_token');
    const storedUser = localStorage.getItem('memed_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse cached user data', e);
        localStorage.removeItem('memed_token');
        localStorage.removeItem('memed_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('memed_token', newToken);
    localStorage.setItem('memed_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    if (newUser.role === 'brand') {
      router.push('/brand');
    } else {
      router.push('/creator');
    }
  };

  const logout = () => {
    localStorage.removeItem('memed_token');
    localStorage.removeItem('memed_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await apiClient<{ user: AuthUser }>('/auth/me');
      setUser(res.user);
      localStorage.setItem('memed_user', JSON.stringify(res.user));
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
