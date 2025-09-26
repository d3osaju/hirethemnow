import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { authAPI } from '../services/api';
import { AuthContext } from './AuthContextType';

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
      console.log('🔑 Starting Google OAuth flow...');
      console.log('📤 Sending token to backend:', token.substring(0, 50) + '...');
      console.log('🌐 API URL:', authAPI.googleAuth.toString());

      const response = await authAPI.googleAuth(token);
      console.log('📥 Backend response received:', response);
      console.log('✅ Response success:', response?.success);
      console.log('📄 Response data:', response?.data);

      if (response && response.success) {
        console.log('🎉 Google authentication successful!');
        console.log('👤 User data:', response.data.user);
        console.log('🔐 JWT token received:', response.data.token.substring(0, 50) + '...');

        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
      } else {
        console.error('❌ Backend returned unsuccessful response:', response);
        throw new Error(`Backend error: ${response?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 GoogleLogin error in AuthContext:', error);
      console.error('📊 Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        response: (error as any)?.response?.data
      });
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