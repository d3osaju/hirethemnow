import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            setUser(response.data);
          }
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      }
    } catch {
      throw new Error('Login failed');
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      }
    } catch {
      throw new Error('Registration failed');
    }
  };

  const googleLogin = async (token: string) => {
    try {
      const response = await authAPI.googleAuth(token);
      if (response.success) {
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      }
    } catch {
      throw new Error('Google login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    authAPI.logout().catch(() => {}); // Fire and forget
  };

  const value = {
    user,
    token,
    login,
    register,
    googleLogin,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};