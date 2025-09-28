import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config();

export const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper function to create authenticated axios instance
export function createAuthenticatedApi(token) {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
}

// Helper function to create multipart form axios instance
export function createMultipartApi(token) {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Authorization': `Bearer ${token}`
      // Content-Type will be set automatically for multipart/form-data
    }
  });
}

// Test data generators
export function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `test.user.${timestamp}@example.com`,
    password: 'testpassword123',
    name: `Test User ${timestamp}`,
    role: 'candidate'
  };
}

export function generateTestJob() {
  const timestamp = Date.now();
  return {
    title: `Test Job ${timestamp}`,
    company: `Test Company ${timestamp}`,
    location: 'Remote',
    type: 'full-time',
    description: 'This is a test job description',
    requirements: ['JavaScript', 'Node.js', 'React'],
    salary: {
      min: 80000,
      max: 120000,
      currency: 'USD'
    },
    isRemote: true,
    experienceLevel: 'mid'
  };
}

// Helper to wait for a specified time
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to check if API is ready
export async function waitForApi(maxAttempts = 10, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await api.get('/health');
      console.log('✓ API is ready');
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for API... (attempt ${i + 1}/${maxAttempts})`);
      await delay(delayMs);
    }
  }
  throw new Error('API did not become ready within the expected time');
}

// Cleanup helpers
export async function cleanupTestUser(token, userId) {
  try {
    const authApi = createAuthenticatedApi(token);
    await authApi.delete(`/users/${userId}`);
  } catch (error) {
    console.warn('Failed to cleanup test user:', error.message);
  }
}

// Response validation helpers
export function validateApiResponse(response, expectSuccess = true) {
  if (expectSuccess) {
    if (!response.data.success) {
      throw new Error(`Expected success response but got: ${response.data.message}`);
    }
  }
  return response.data;
}

export function validateUserObject(user) {
  const requiredFields = ['id', 'email', 'name', 'role'];
  for (const field of requiredFields) {
    if (!user[field]) {
      throw new Error(`User object missing required field: ${field}`);
    }
  }
}

export function validateJobObject(job) {
  const requiredFields = ['id', 'title', 'company', 'location'];
  for (const field of requiredFields) {
    if (!job[field]) {
      throw new Error(`Job object missing required field: ${field}`);
    }
  }
}

// Mock file creation for testing
export function createMockResumeFile() {
  // This creates a simple text file for testing file upload
  const content = `
    JOHN DOE
    Software Engineer

    Experience:
    - Senior Developer at Tech Corp (2020-2023)
    - Full Stack Developer at StartupXYZ (2018-2020)

    Skills:
    - JavaScript, TypeScript, React, Node.js
    - Python, Django, Flask
    - AWS, Docker, Kubernetes

    Education:
    - Bachelor of Computer Science, University ABC (2018)
  `;

  // In Node.js, we'll create a Buffer that can be used as file content
  return {
    data: Buffer.from(content, 'utf8'),
    filename: 'test-resume.txt',
    contentType: 'text/plain'
  };
}