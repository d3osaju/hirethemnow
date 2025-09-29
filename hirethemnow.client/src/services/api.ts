import axios from 'axios';
import type { User, ApiResponse } from '../types';
import { config, logger } from '../config/environment';

const API_BASE_URL = config.apiUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and logging
api.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }

  logger.debug();

  return requestConfig;
});

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    logger.debug();
    return response;
  },
  (error) => {
    logger.error();

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: Partial<User> & { password: string }): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  googleAuth: async (token: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/auth/google', { token });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};






export default api;