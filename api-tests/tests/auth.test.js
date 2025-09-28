import { expect } from 'chai';
import {
  api,
  createAuthenticatedApi,
  generateTestUser,
  validateApiResponse,
  validateUserObject,
  cleanupTestUser
} from '../utils/testUtils.js';

describe('Authentication API Tests', function() {
  let testUser;
  let authToken;
  let userId;

  beforeEach(function() {
    testUser = generateTestUser();
  });

  afterEach(async function() {
    // Cleanup created test user
    if (authToken && userId) {
      await cleanupTestUser(authToken, userId);
      authToken = null;
      userId = null;
    }
  });

  describe('POST /api/auth/register', function() {
    it('should register a new user successfully', async function() {
      const response = await api.post('/auth/register', {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
        role: testUser.role
      });

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.message).to.equal('Registration successful');
      expect(data.data).to.have.property('user');
      expect(data.data).to.have.property('token');

      validateUserObject(data.data.user);
      expect(data.data.user.email).to.equal(testUser.email);
      expect(data.data.user.name).to.equal(testUser.name);
      expect(data.data.user.role).to.equal(testUser.role);

      // Store for cleanup
      authToken = data.data.token;
      userId = data.data.user.id;
    });

    it('should require email and password', async function() {
      try {
        await api.post('/auth/register', {
          name: testUser.name
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.include('Email and password are required');
      }
    });

    it('should not allow duplicate email registration', async function() {
      // Register first user
      await api.post('/auth/register', {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name
      });

      // Try to register with same email
      try {
        await api.post('/auth/register', {
          email: testUser.email,
          password: 'differentpassword',
          name: 'Different Name'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.include('User with this email already exists');
      }
    });

    it('should use default values when optional fields are missing', async function() {
      const response = await api.post('/auth/register', {
        email: testUser.email,
        password: testUser.password
        // No name or role provided
      });

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      expect(data.data.user.name).to.equal('New User'); // Default name
      expect(data.data.user.role).to.equal('candidate'); // Default role

      authToken = data.data.token;
      userId = data.data.user.id;
    });
  });

  describe('POST /api/auth/login', function() {
    beforeEach(async function() {
      // Create a user to login with
      const registerResponse = await api.post('/auth/register', {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
        role: testUser.role
      });

      const registerData = validateApiResponse(registerResponse);
      userId = registerData.data.user.id;
    });

    it('should login successfully with valid credentials', async function() {
      const response = await api.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.message).to.equal('Login successful');
      expect(data.data).to.have.property('user');
      expect(data.data).to.have.property('token');

      validateUserObject(data.data.user);
      expect(data.data.user.email).to.equal(testUser.email);

      authToken = data.data.token;
    });

    it('should require email and password', async function() {
      try {
        await api.post('/auth/login', {
          email: testUser.email
          // No password
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.include('Email and password are required');
      }
    });

    it('should reject invalid email', async function() {
      try {
        await api.post('/auth/login', {
          email: 'nonexistent@example.com',
          password: testUser.password
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.include('Invalid email or password');
      }
    });
  });

  describe('POST /api/auth/google', function() {
    it('should reject invalid Google token', async function() {
      try {
        await api.post('/auth/google', {
          token: 'invalid_token'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.include('Invalid Google token');
      }
    });

    it('should require token in request body', async function() {
      try {
        await api.post('/auth/google', {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });

  describe('POST /api/auth/logout', function() {
    it('should logout successfully', async function() {
      const response = await api.post('/auth/logout');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.message).to.equal('Logout successful');
    });
  });

  describe('GET /api/auth/profile', function() {
    beforeEach(async function() {
      // Register and login to get auth token
      const registerResponse = await api.post('/auth/register', {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
        role: testUser.role
      });

      const registerData = validateApiResponse(registerResponse);
      authToken = registerData.data.token;
      userId = registerData.data.user.id;
    });

    it('should get user profile with valid token', async function() {
      const authApi = createAuthenticatedApi(authToken);
      const response = await authApi.get('/auth/profile');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.message).to.equal('Profile retrieved successfully');
      expect(data.data).to.have.property('id');
      expect(data.data).to.have.property('email');
      expect(data.data).to.have.property('name');
      expect(data.data).to.have.property('role');
      expect(data.data).to.have.property('isCompleted');
      expect(data.data).to.have.property('createdAt');

      expect(data.data.email).to.equal(testUser.email);
      expect(data.data.name).to.equal(testUser.name);
      expect(data.data.role).to.equal(testUser.role);
    });

    it('should reject request without authorization header', async function() {
      try {
        await api.get('/auth/profile');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should reject request with invalid token', async function() {
      try {
        const invalidAuthApi = createAuthenticatedApi('invalid_token');
        await invalidAuthApi.get('/auth/profile');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });
  });

  describe('JWT Token Validation', function() {
    it('should generate valid JWT token on registration', async function() {
      const response = await api.post('/auth/register', {
        email: testUser.email,
        password: testUser.password,
        name: testUser.name
      });

      const data = validateApiResponse(response);
      const token = data.data.token;

      // JWT should have 3 parts separated by dots
      expect(token.split('.')).to.have.lengthOf(3);

      // Token should work for authenticated requests
      const authApi = createAuthenticatedApi(token);
      const profileResponse = await authApi.get('/auth/profile');
      expect(profileResponse.status).to.equal(200);

      authToken = token;
      userId = data.data.user.id;
    });
  });

  describe('Authentication Error Handling', function() {
    it('should handle malformed JSON in request body', async function() {
      try {
        await api.post('/auth/register', 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });

    it('should handle missing request body', async function() {
      try {
        await api.post('/auth/login');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });
});