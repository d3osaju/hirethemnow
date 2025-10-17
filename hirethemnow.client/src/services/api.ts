import axios from 'axios';
import type { User, ApiResponse, ResumeAnalysisResult, JobOpportunity, UpdateContactRequest, PagedResult, AdminUser, AdminJobOpportunity, JobApplication, DashboardMetrics, ChartData, RecentActivity } from '../types';
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
    } else if (error.response?.status === 403) {
      // Handle forbidden access (e.g., non-admin trying to access admin endpoints)
      if (error.config?.url?.includes('/admin/')) {
        window.location.href = '/401'; // Redirect to unauthorized page
      }
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

// Admin Contact Management API
/**
 * Admin-only API endpoints for managing HR contacts and job opportunities.
 * All endpoints require admin role authentication.
 */
export const adminContactAPI = {
  /**
   * Get paginated list of HR contacts with optional search and sorting
   * @param page - Page number (1-based)
   * @param pageSize - Number of items per page
   * @param search - Search term for company name or job title
   * @param sortBy - Sort field (createdAt, company, jobTitle)
   */
  getContacts: async (page: number = 1, pageSize: number = 20, search?: string, sortBy?: string): Promise<ApiResponse<PagedResult<JobOpportunity>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }
    
    if (sortBy) {
      params.append('sortBy', sortBy);
    }

    const response = await api.get(`/admin/contacts?${params.toString()}`);
    return response.data;
  },

  /**
   * Get detailed information for a specific HR contact
   * @param id - Contact ID
   */
  getContact: async (id: number): Promise<ApiResponse<JobOpportunity>> => {
    const response = await api.get(`/admin/contacts/${id}`);
    return response.data;
  },

  /**
   * Update HR contact information
   * @param id - Contact ID
   * @param contactData - Updated contact data
   */
  updateContact: async (id: number, contactData: UpdateContactRequest): Promise<ApiResponse<JobOpportunity>> => {
    const response = await api.put(`/admin/contacts/${id}`, contactData);
    return response.data;
  },

  /**
   * Delete an HR contact permanently
   * @param id - Contact ID
   */
  deleteContact: async (id: number): Promise<ApiResponse<object>> => {
    const response = await api.delete(`/admin/contacts/${id}`);
    return response.data;
  },
};

// Admin Analytics API
export const adminAnalyticsAPI = {
  /**
   * Get dashboard metrics
   */
  getMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
    const response = await api.get('/admin/analytics/metrics');
    return response.data;
  },

  /**
   * Get chart data for visualizations
   */
  getChartData: async (timeRange: '7d' | '30d' | '90d' | '1y'): Promise<ApiResponse<ChartData>> => {
    const response = await api.get(`/admin/analytics/charts?range=${timeRange}`);
    return response.data;
  },

  /**
   * Get recent activity feed
   */
  getRecentActivity: async (limit: number = 10): Promise<ApiResponse<RecentActivity[]>> => {
    const response = await api.get(`/admin/analytics/activity?limit=${limit}`);
    return response.data;
  },
};

// Admin Job Management API
export const adminJobAPI = {
  /**
   * Get paginated jobs with filtering and sorting
   */
  getJobs: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    locationType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<PagedResult<AdminJobOpportunity>>> => {
    const response = await api.get('/admin/jobs', { params });
    return response.data;
  },

  /**
   * Get single job details with applications
   */
  getJob: async (id: number): Promise<ApiResponse<AdminJobOpportunity & { applications: JobApplication[] }>> => {
    const response = await api.get(`/admin/jobs/${id}`);
    return response.data;
  },

  /**
   * Create new job posting
   */
  createJob: async (jobData: Omit<AdminJobOpportunity, 'id' | 'createdBy' | 'postedAt' | 'updatedAt' | 'applicationCount' | 'viewCount'>): Promise<ApiResponse<AdminJobOpportunity>> => {
    const response = await api.post('/admin/jobs', jobData);
    return response.data;
  },

  /**
   * Update job posting
   */
  updateJob: async (id: number, jobData: Partial<AdminJobOpportunity>): Promise<ApiResponse<AdminJobOpportunity>> => {
    const response = await api.put(`/admin/jobs/${id}`, jobData);
    return response.data;
  },

  /**
   * Delete job posting
   */
  deleteJob: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/admin/jobs/${id}`);
    return response.data;
  },
};

// Admin User Management API
export const adminUserAPI = {
  /**
   * Get paginated users with filtering and sorting
   */
  getUsers: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    trialStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<PagedResult<AdminUser>>> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Get single user details
   */
  getUser: async (id: string): Promise<ApiResponse<AdminUser>> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Update user (admin can modify any field)
   */
  updateUser: async (id: string, userData: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  /**
   * Delete user account
   */
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Create new user (admin creation)
   */
  createUser: async (userData: {
    name: string;
    email: string;
    role: 'candidate' | 'admin';
    password?: string;
  }): Promise<ApiResponse<AdminUser>> => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },
};

export default api;