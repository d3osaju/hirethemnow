import axios from 'axios';
import type { User, ApiResponse, ResumeAnalysisResult } from '../types';
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

  updateProfile: async (profileData: { name?: string; phone?: string; location?: string; bio?: string; skills?: string[]; title?: string; industry?: string; experience?: string }): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  uploadProfilePicture: async (file: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('picture', file);

    const response = await api.post('/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Resume API
export const resumeAPI = {
  uploadResume: async (file: File): Promise<ApiResponse<{ resumeUrl: string; fileName: string; status: string; parsingStatus: string; parsingId: number }>> => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getResumeStatus: async (): Promise<ApiResponse<{ hasResume: boolean; needsUpload: boolean; status: string; resumeUrl?: string }>> => {
    const response = await api.get('/resume/status');
    return response.data;
  },

  getParsingStatus: async (): Promise<ApiResponse<{ id: number; fileName: string; status: string; uploadedAt: string; parsedAt: string | null; error: string | null }>> => {
    const response = await api.get('/resume/parsing-status');
    return response.data;
  },

  getResumeContent: async (): Promise<ApiResponse<{ id: number; fileName: string; contentType: string; parsedContent: string; textContent: string; status: string; uploadedAt: string; parsedAt: string | null }>> => {
    const response = await api.get('/resume/content');
    return response.data;
  },

  getResumeHistory: async (): Promise<ApiResponse<Array<{ id: number; fileName: string; contentType: string; status: string; uploadedAt: string; parsedAt: string | null; fileSizeBytes: number; error: string | null }>>> => {
    const response = await api.get('/resume/content/history');
    return response.data;
  },

  downloadResume: async (): Promise<{ success: boolean; message?: string; needsUpload?: boolean }> => {
    try {
      const response = await api.get('/resume/download', {
        responseType: 'blob',
      });

      // Check if response is JSON (error case) vs blob (success case)
      if (response.headers['content-type']?.includes('application/json')) {
        // Convert blob to text to read JSON error response
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        return {
          success: false,
          message: errorData.message,
          needsUpload: errorData.needsUpload || false
        };
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'resume.pdf';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error: unknown) {
      // Handle JSON error responses
      if (error && typeof error === 'object' && 'response' in error && (error as { response?: { data?: unknown } }).response?.data) {
        try {
          const errorData = (error as { response: { data: { message?: string; needsUpload?: boolean } } }).response.data;
          return {
            success: false,
            message: errorData.message,
            needsUpload: errorData.needsUpload || false
          };
        } catch {
          // Fall back to generic error
        }
      }

      return {
        success: false,
        message: 'Failed to download resume',
        needsUpload: true
      };
    }
  },
};

// Email Preferences API
export const emailPreferencesAPI = {
  getPreferences: async (): Promise<ApiResponse<{ weeklyPerformanceReport: boolean; marketingEmails: boolean }>> => {
    const response = await api.get('/emailpreferences');
    return response.data;
  },

  updatePreferences: async (preferences: { weeklyPerformanceReport?: boolean; marketingEmails?: boolean }): Promise<ApiResponse<{ weeklyPerformanceReport: boolean; marketingEmails: boolean }>> => {
    const response = await api.put('/emailpreferences', preferences);
    return response.data;
  },
};

// Trial API
export const trialAPI = {
  acknowledgeTrialEnd: async (): Promise<ApiResponse<void>> => {
    const response = await api.post('/auth/trial/acknowledge');
    return response.data;
  },
};

// Industries API
export const industriesAPI = {
  getIndustries: async (): Promise<ApiResponse<Array<{ id: number; name: string; skills: Array<{ id: number; name: string; industryId: number }> }>>> => {
    const response = await api.get('/industries');
    return response.data;
  },

  getSkillsByIndustry: async (industryId: number): Promise<ApiResponse<Array<{ id: number; name: string; industryId: number }>>> => {
    const response = await api.get(`/industries/${industryId}/skills`);
    return response.data;
  },
};

// Privacy Settings API
export const privacyAPI = {
  getSettings: async (): Promise<ApiResponse<{ profileVisibility: string; allowAnalyticsDataSharing: boolean }>> => {
    const response = await api.get('/privacy');
    return response.data;
  },

  updateSettings: async (settings: { profileVisibility?: string; allowAnalyticsDataSharing?: boolean }): Promise<ApiResponse<{ profileVisibility: string; allowAnalyticsDataSharing: boolean }>> => {
    const response = await api.put('/privacy', settings);
    return response.data;
  },
};

// Data Management API
export const dataAPI = {
  exportData: async (): Promise<Blob> => {
    const response = await api.get('/data/export', {
      responseType: 'blob'
    });
    return response.data;
  },

  deleteAccount: async (confirmation: string): Promise<ApiResponse<void>> => {
    const response = await api.delete('/data/account', {
      data: { confirmation }
    });
    return response.data;
  },
};

// Resume Analysis API
export const resumeAnalysisAPI = {
  getStatus: async (): Promise<ApiResponse<{ status: string; message?: string; overallScore?: number; completedAt?: string; errorMessage?: string }>> => {
    const response = await api.get('/resume/analysis/status');
    return response.data;
  },

  getResults: async (): Promise<ApiResponse<ResumeAnalysisResult>> => {
    const response = await api.get('/resume/analysis/results');
    return response.data;
  },

  retry: async (): Promise<ApiResponse<string>> => {
    const response = await api.post('/resume/analysis/retry');
    return response.data;
  },
};

// Release Notes API
export const releaseNotesAPI = {
  getReleaseNotes: async (): Promise<ApiResponse<Array<{ id: number; version: string; releaseDate: string; features: string[]; isPublished: boolean; createdAt: string }>>> => {
    const response = await api.get('/releasenotes');
    return response.data;
  },
};

export default api;