import axios from 'axios';
import type { User, Job, Application, ApiResponse, ResumeAnalysis, MailboxMessage } from '../types';
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

// Jobs API with mock data fallback for local development
export const jobsAPI = {
  getJobs: async (page = 1, limit = 10, filters?: Record<string, string>): Promise<ApiResponse<{ jobs: Job[]; total: number }>> => {
    try {
      const response = await api.get('/jobs', { params: { page, limit, ...filters } });
      return response.data;
    } catch (error) {
      // Fallback to mock data for local development
      if (config.enableMockData) {
        logger.info();
        return getMockJobs();
      }
      throw error;
    }
  },

  getJob: async (id: string): Promise<ApiResponse<Job>> => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  createJob: async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Job>> => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },

  updateJob: async (id: string, jobData: Partial<Job>): Promise<ApiResponse<Job>> => {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  },

  deleteJob: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },
};

// Applications API
export const applicationsAPI = {
  getApplications: async (jobId?: string): Promise<ApiResponse<Application[]>> => {
    const response = await api.get('/applications', { params: { jobId } });
    return response.data;
  },

  apply: async (jobId: string, applicationData: { coverLetter?: string; resumeUrl?: string }): Promise<ApiResponse<Application>> => {
    const response = await api.post(`/jobs/${jobId}/apply`, applicationData);
    return response.data;
  },

  updateApplicationStatus: async (id: string, status: Application['status']): Promise<ApiResponse<Application>> => {
    const response = await api.put(`/applications/${id}`, { status });
    return response.data;
  },
};

// Resume API
export const resumeAPI = {
  uploadResume: async (file: File): Promise<ApiResponse<ResumeAnalysis>> => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getResumeAnalysis: async (): Promise<ApiResponse<ResumeAnalysis | { hasResume: boolean; needsUpload: boolean; message: string }>> => {
    const response = await api.get('/resume/analysis');
    return response.data;
  },

  getResumeStatus: async (): Promise<ApiResponse<{ hasResume: boolean; needsUpload: boolean; status: string; [key: string]: unknown }>> => {
    const response = await api.get('/resume/status');
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
          needsUpload: errorData.data?.needsUpload || false
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
          const errorData = (error as { response: { data: { message?: string; data?: { needsUpload?: boolean } } } }).response.data;
          return {
            success: false,
            message: errorData.message,
            needsUpload: errorData.data?.needsUpload || false
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

// Mailbox API
export const mailboxAPI = {
  getEmails: async (): Promise<ApiResponse<MailboxMessage[]>> => {
    const response = await api.get('/mailbox/emails');
    return response.data;
  },
};

// Mock data for local development
const getMockJobs = (): ApiResponse<{ jobs: Job[]; total: number }> => ({
  success: true,
  message: 'Mock data loaded successfully',
  data: {
    jobs: [
      {
        id: '1',
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        description: 'We are looking for a skilled Frontend Developer with React experience to join our dynamic team.',
        requirements: ['React', 'TypeScript', 'CSS', '3+ years experience'],
        location: 'San Francisco, CA',
        salary: { min: 100000, max: 150000, currency: 'USD' },
        type: 'full-time',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        employerId: 'emp1',
      },
      {
        id: '2',
        title: 'Backend Engineer',
        company: 'StartupXYZ',
        description: 'Join our growing team as a Backend Engineer working with Node.js, AWS, and modern technologies.',
        requirements: ['Node.js', 'AWS', 'MongoDB', '2+ years experience'],
        location: 'Remote',
        salary: { min: 80000, max: 120000, currency: 'USD' },
        type: 'remote',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        employerId: 'emp2',
      },
      {
        id: '3',
        title: 'Product Manager',
        company: 'InnovateLabs',
        description: 'Lead product strategy and work with cross-functional teams to deliver exceptional user experiences.',
        requirements: ['Product Management', 'Agile', 'Analytics', '5+ years experience'],
        location: 'New York, NY',
        salary: { min: 120000, max: 180000, currency: 'USD' },
        type: 'full-time',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        employerId: 'emp3',
      },
      {
        id: '4',
        title: 'DevOps Engineer',
        company: 'CloudFirst Solutions',
        description: 'Help us build and maintain scalable infrastructure using modern DevOps practices.',
        requirements: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', '3+ years experience'],
        location: 'Austin, TX',
        salary: { min: 95000, max: 140000, currency: 'USD' },
        type: 'full-time',
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
        employerId: 'emp4',
      }
    ],
    total: 4,
  },
});

export default api;