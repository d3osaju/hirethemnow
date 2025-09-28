import { expect } from 'chai';
import FormData from 'form-data';
import {
  api,
  createAuthenticatedApi,
  createMultipartApi,
  generateTestUser,
  validateApiResponse,
  cleanupTestUser,
  createMockResumeFile
} from '../utils/testUtils.js';

describe('Resume API Tests', function() {
  let testUser;
  let authToken;
  let userId;
  let authApi;

  beforeEach(async function() {
    testUser = generateTestUser();

    // Register user and get auth token
    const registerResponse = await api.post('/auth/register', {
      email: testUser.email,
      password: testUser.password,
      name: testUser.name,
      role: testUser.role
    });

    const registerData = validateApiResponse(registerResponse);
    authToken = registerData.data.token;
    userId = registerData.data.user.id;
    authApi = createAuthenticatedApi(authToken);
  });

  afterEach(async function() {
    // Cleanup created test user
    if (authToken && userId) {
      await cleanupTestUser(authToken, userId);
    }
  });

  describe('POST /api/resume/upload', function() {
    it('should upload a resume file successfully', async function() {
      this.timeout(15000); // File uploads may take longer

      const mockFile = createMockResumeFile();
      const formData = new FormData();
      formData.append('resume', mockFile.data, {
        filename: mockFile.filename,
        contentType: mockFile.contentType
      });

      const multipartApi = createMultipartApi(authToken);

      const response = await multipartApi.post('/resume/upload', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.message).to.equal('Resume uploaded successfully.');
      expect(data.data).to.have.property('id');
      expect(data.data).to.have.property('userId');
      expect(data.data).to.have.property('resumeFileName');
      expect(data.data).to.have.property('resumeFilePath');
      expect(data.data).to.have.property('analysisStatus');
      expect(data.data).to.have.property('createdAt');
      expect(data.data).to.have.property('updatedAt');

      expect(data.data.userId).to.equal(userId);
      expect(data.data.resumeFileName).to.equal(mockFile.filename);
      expect(data.data.analysisStatus).to.equal('uploaded');
    });

    it('should reject upload without authentication', async function() {
      const mockFile = createMockResumeFile();
      const formData = new FormData();
      formData.append('resume', mockFile.data, {
        filename: mockFile.filename,
        contentType: mockFile.contentType
      });

      try {
        await api.post('/resume/upload', formData, {
          headers: {
            ...formData.getHeaders()
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should reject upload without file', async function() {
      const formData = new FormData();
      // No file appended

      const multipartApi = createMultipartApi(authToken);

      try {
        await multipartApi.post('/resume/upload', formData, {
          headers: {
            ...formData.getHeaders()
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.equal('No file uploaded');
      }
    });

    it('should reject unsupported file types', async function() {
      // Create a file with unsupported extension
      const mockFile = {
        data: Buffer.from('This is not a resume', 'utf8'),
        filename: 'test-file.xyz',
        contentType: 'application/octet-stream'
      };

      const formData = new FormData();
      formData.append('resume', mockFile.data, {
        filename: mockFile.filename,
        contentType: mockFile.contentType
      });

      const multipartApi = createMultipartApi(authToken);

      try {
        await multipartApi.post('/resume/upload', formData, {
          headers: {
            ...formData.getHeaders()
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.equal('Only PDF and Word documents are allowed');
      }
    });

    it('should reject files larger than 2MB', async function() {
      // Create a large file (simulate > 2MB)
      const largeContent = 'x'.repeat(3 * 1024 * 1024); // 3MB of 'x' characters
      const mockFile = {
        data: Buffer.from(largeContent, 'utf8'),
        filename: 'large-resume.pdf',
        contentType: 'application/pdf'
      };

      const formData = new FormData();
      formData.append('resume', mockFile.data, {
        filename: mockFile.filename,
        contentType: mockFile.contentType
      });

      const multipartApi = createMultipartApi(authToken);

      try {
        await multipartApi.post('/resume/upload', formData, {
          headers: {
            ...formData.getHeaders()
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.equal('File size must be less than 2MB');
      }
    });
  });

  describe('GET /api/resume/analysis', function() {
    it('should return 404 when no resume exists', async function() {
      try {
        await authApi.get('/resume/analysis');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.equal('No resume analysis found');
      }
    });

    it('should return resume analysis after upload', async function() {
      this.timeout(15000);

      // First upload a resume
      const mockFile = createMockResumeFile();
      const formData = new FormData();
      formData.append('resume', mockFile.data, {
        filename: mockFile.filename,
        contentType: mockFile.contentType
      });

      const multipartApi = createMultipartApi(authToken);
      await multipartApi.post('/resume/upload', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      // Now get the analysis
      const response = await authApi.get('/resume/analysis');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.message).to.equal('Resume analysis retrieved successfully');
      expect(data.data).to.have.property('id');
      expect(data.data).to.have.property('userId');
      expect(data.data).to.have.property('resumeFileName');
      expect(data.data).to.have.property('resumeFilePath');
      expect(data.data).to.have.property('analysisStatus');

      expect(data.data.userId).to.equal(userId);
      expect(data.data.resumeFileName).to.equal(mockFile.filename);
    });

    it('should reject request without authentication', async function() {
      try {
        await api.get('/resume/analysis');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });
  });

  describe('GET /api/resume/download', function() {
    it('should return 404 when no resume exists', async function() {
      try {
        await authApi.get('/resume/download');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.equal('No resume found');
      }
    });

    it('should download resume file after upload', async function() {
      this.timeout(15000);

      // First upload a resume
      const mockFile = createMockResumeFile();
      const formData = new FormData();
      formData.append('resume', mockFile.data, {
        filename: mockFile.filename,
        contentType: mockFile.contentType
      });

      const multipartApi = createMultipartApi(authToken);
      await multipartApi.post('/resume/upload', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      // Now download the resume
      const response = await authApi.get('/resume/download', {
        responseType: 'stream' // Important for file downloads
      });

      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.equal('text/plain');

      // Verify we get some content back
      expect(response.data).to.exist;
    });

    it('should reject request without authentication', async function() {
      try {
        await api.get('/resume/download');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should set correct content-type for PDF files', async function() {
      this.timeout(15000);

      // Upload a PDF file
      const mockPdfFile = {
        data: Buffer.from('%PDF-1.4 fake pdf content', 'utf8'),
        filename: 'test-resume.pdf',
        contentType: 'application/pdf'
      };

      const formData = new FormData();
      formData.append('resume', mockPdfFile.data, {
        filename: mockPdfFile.filename,
        contentType: mockPdfFile.contentType
      });

      const multipartApi = createMultipartApi(authToken);
      await multipartApi.post('/resume/upload', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      // Download and check content type
      const response = await authApi.get('/resume/download', {
        responseType: 'stream'
      });

      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.equal('application/pdf');
    });
  });

  describe('Resume API Error Handling', function() {
    it('should handle invalid authentication token', async function() {
      const invalidAuthApi = createAuthenticatedApi('invalid_token');

      try {
        await invalidAuthApi.get('/resume/analysis');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should handle multiple file uploads (update scenario)', async function() {
      this.timeout(20000);

      const mockFile1 = createMockResumeFile();
      mockFile1.filename = 'resume-v1.txt';

      const mockFile2 = createMockResumeFile();
      mockFile2.filename = 'resume-v2.txt';

      const multipartApi = createMultipartApi(authToken);

      // Upload first resume
      const formData1 = new FormData();
      formData1.append('resume', mockFile1.data, {
        filename: mockFile1.filename,
        contentType: mockFile1.contentType
      });

      await multipartApi.post('/resume/upload', formData1, {
        headers: {
          ...formData1.getHeaders()
        }
      });

      // Upload second resume (should update/replace)
      const formData2 = new FormData();
      formData2.append('resume', mockFile2.data, {
        filename: mockFile2.filename,
        contentType: mockFile2.contentType
      });

      const response = await multipartApi.post('/resume/upload', formData2, {
        headers: {
          ...formData2.getHeaders()
        }
      });

      expect(response.status).to.equal(200);

      // Verify the latest resume is returned
      const analysisResponse = await authApi.get('/resume/analysis');
      const analysisData = validateApiResponse(analysisResponse);
      expect(analysisData.data.resumeFileName).to.equal(mockFile2.filename);
    });
  });
});