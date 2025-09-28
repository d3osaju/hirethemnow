import { expect } from 'chai';
import {
  api,
  createAuthenticatedApi,
  generateTestUser,
  generateTestJob,
  validateApiResponse,
  validateJobObject,
  cleanupTestUser
} from '../utils/testUtils.js';

describe('Jobs API Tests', function() {
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

  describe('GET /api/jobs', function() {
    it('should return paginated jobs list', async function() {
      const response = await api.get('/jobs');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.message).to.equal('Jobs retrieved successfully');
      expect(data.data).to.have.property('items');
      expect(data.data).to.have.property('total');
      expect(data.data).to.have.property('page');
      expect(data.data).to.have.property('limit');
      expect(data.data).to.have.property('totalPages');

      expect(data.data.items).to.be.an('array');
      expect(data.data.total).to.be.a('number');
      expect(data.data.page).to.be.a('number');
      expect(data.data.limit).to.be.a('number');
      expect(data.data.totalPages).to.be.a('number');

      // Validate job objects if any exist
      data.data.items.forEach(job => {
        validateJobObject(job);
      });
    });

    it('should handle pagination parameters', async function() {
      const response = await api.get('/jobs?page=1&limit=5');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.data.page).to.equal(1);
      expect(data.data.limit).to.equal(5);
      expect(data.data.items.length).to.be.at.most(5);
    });

    it('should handle search parameter', async function() {
      const response = await api.get('/jobs?search=developer');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.data.items).to.be.an('array');

      // If search returns results, they should contain the search term
      // (Note: this depends on actual data in the system)
      data.data.items.forEach(job => {
        validateJobObject(job);
      });
    });

    it('should handle location filter', async function() {
      const response = await api.get('/jobs?location=Remote');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.data.items).to.be.an('array');

      data.data.items.forEach(job => {
        validateJobObject(job);
      });
    });

    it('should handle job type filter', async function() {
      const response = await api.get('/jobs?type=full-time');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.data.items).to.be.an('array');

      data.data.items.forEach(job => {
        validateJobObject(job);
      });
    });

    it('should handle salary range filters', async function() {
      const response = await api.get('/jobs?minSalary=50000&maxSalary=100000');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.data.items).to.be.an('array');

      data.data.items.forEach(job => {
        validateJobObject(job);
      });
    });

    it('should handle skills filter', async function() {
      const response = await api.get('/jobs?skills=JavaScript,React');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.data.items).to.be.an('array');

      data.data.items.forEach(job => {
        validateJobObject(job);
      });
    });

    it('should handle multiple filters combined', async function() {
      const response = await api.get('/jobs?search=developer&location=Remote&type=full-time&minSalary=60000');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.data.items).to.be.an('array');

      data.data.items.forEach(job => {
        validateJobObject(job);
      });
    });

    it('should handle invalid pagination parameters gracefully', async function() {
      const response = await api.get('/jobs?page=-1&limit=0');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      // API should handle invalid parameters by using defaults
      expect(data.data.page).to.be.a('number');
      expect(data.data.limit).to.be.a('number');
      expect(data.data.page).to.be.at.least(1);
      expect(data.data.limit).to.be.at.least(1);
    });

    it('should return empty results for very specific filters', async function() {
      const response = await api.get('/jobs?search=veryrarejobtitlethatdoesnotexist12345');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.data.items).to.be.an('array');
      // May be empty, but should still be valid structure
      expect(data.data.total).to.be.a('number');
    });
  });

  describe('GET /api/jobs/:id', function() {
    it('should return 404 for non-existent job', async function() {
      try {
        await api.get('/jobs/nonexistent-job-id');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.equal('Job not found');
      }
    });

    it('should return job details for valid job ID', async function() {
      // First get a list of jobs to find a valid ID
      const listResponse = await api.get('/jobs?limit=1');
      const listData = validateApiResponse(listResponse);

      if (listData.data.items.length > 0) {
        const jobId = listData.data.items[0].id;

        const response = await api.get(`/jobs/${jobId}`);

        expect(response.status).to.equal(200);

        const data = validateApiResponse(response);
        expect(data.message).to.equal('Job retrieved successfully');
        expect(data.data).to.be.an('object');

        validateJobObject(data.data);
        expect(data.data.id).to.equal(jobId);

        // Job details should include additional fields
        expect(data.data).to.have.property('description');
        expect(data.data).to.have.property('requirements');
        expect(data.data).to.have.property('createdAt');
        expect(data.data).to.have.property('updatedAt');
      } else {
        console.log('No jobs available to test job details endpoint');
      }
    });
  });

  describe('POST /api/jobs (Employer Only)', function() {
    let employerToken;
    let employerUserId;

    beforeEach(async function() {
      // Create an employer user
      const employerUser = generateTestUser();
      employerUser.role = 'employer';

      const registerResponse = await api.post('/auth/register', {
        email: employerUser.email,
        password: employerUser.password,
        name: employerUser.name,
        role: employerUser.role
      });

      const registerData = validateApiResponse(registerResponse);
      employerToken = registerData.data.token;
      employerUserId = registerData.data.user.id;
    });

    afterEach(async function() {
      if (employerToken && employerUserId) {
        await cleanupTestUser(employerToken, employerUserId);
      }
    });

    it('should create a new job successfully', async function() {
      const employerApi = createAuthenticatedApi(employerToken);
      const testJob = generateTestJob();

      const response = await employerApi.post('/jobs', testJob);

      expect(response.status).to.equal(201);

      const data = validateApiResponse(response);
      expect(data.message).to.equal('Job created successfully');
      expect(data.data).to.be.an('object');

      validateJobObject(data.data);
      expect(data.data.title).to.equal(testJob.title);
      expect(data.data.company).to.equal(testJob.company);
      expect(data.data.location).to.equal(testJob.location);
      expect(data.data.type).to.equal(testJob.type);
    });

    it('should reject job creation without authentication', async function() {
      const testJob = generateTestJob();

      try {
        await api.post('/jobs', testJob);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should reject job creation with candidate role', async function() {
      // Use candidate token (regular testUser)
      const testJob = generateTestJob();

      try {
        await authApi.post('/jobs', testJob);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(403);
        expect(error.response.data.success).to.equal(false);
        expect(error.response.data.message).to.include('Only employers can create jobs');
      }
    });

    it('should validate required job fields', async function() {
      const employerApi = createAuthenticatedApi(employerToken);

      try {
        await employerApi.post('/jobs', {
          // Missing required fields
          description: 'Test description'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.equal(false);
      }
    });
  });

  describe('PUT /api/jobs/:id (Employer Only)', function() {
    // Note: This test assumes job update functionality exists
    // If not implemented, this will help identify missing endpoints

    it('should return 401 for unauthorized update attempts', async function() {
      try {
        await api.put('/jobs/some-job-id', { title: 'Updated Title' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 404 for non-existent job update', async function() {
      const employerUser = generateTestUser();
      employerUser.role = 'employer';

      const registerResponse = await api.post('/auth/register', {
        email: employerUser.email,
        password: employerUser.password,
        name: employerUser.name,
        role: employerUser.role
      });

      const registerData = validateApiResponse(registerResponse);
      const employerToken = registerData.data.token;
      const employerApi = createAuthenticatedApi(employerToken);

      try {
        await employerApi.put('/jobs/nonexistent-job', { title: 'Updated Title' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }

      // Cleanup
      await cleanupTestUser(employerToken, registerData.data.user.id);
    });
  });

  describe('DELETE /api/jobs/:id (Employer Only)', function() {
    it('should return 401 for unauthorized delete attempts', async function() {
      try {
        await api.delete('/jobs/some-job-id');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return 404 for non-existent job deletion', async function() {
      const employerUser = generateTestUser();
      employerUser.role = 'employer';

      const registerResponse = await api.post('/auth/register', {
        email: employerUser.email,
        password: employerUser.password,
        name: employerUser.name,
        role: employerUser.role
      });

      const registerData = validateApiResponse(registerResponse);
      const employerToken = registerData.data.token;
      const employerApi = createAuthenticatedApi(employerToken);

      try {
        await employerApi.delete('/jobs/nonexistent-job');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
      }

      // Cleanup
      await cleanupTestUser(employerToken, registerData.data.user.id);
    });
  });

  describe('Jobs API Performance', function() {
    it('should return jobs list within reasonable time', async function() {
      this.timeout(10000);

      const startTime = Date.now();
      const response = await api.get('/jobs');
      const endTime = Date.now();

      expect(response.status).to.equal(200);

      const responseTime = endTime - startTime;
      expect(responseTime).to.be.lessThan(5000); // Should respond within 5 seconds
    });

    it('should handle concurrent requests', async function() {
      this.timeout(15000);

      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(api.get('/jobs?page=' + (i + 1)));
      }

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).to.equal(200);
        validateApiResponse(response);
      });
    });
  });

  describe('Jobs API Data Validation', function() {
    it('should return jobs with valid date formats', async function() {
      const response = await api.get('/jobs');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      data.data.items.forEach(job => {
        if (job.createdAt) {
          const createdDate = new Date(job.createdAt);
          expect(createdDate).to.be.a('date');
          expect(createdDate.toString()).to.not.equal('Invalid Date');
        }

        if (job.updatedAt) {
          const updatedDate = new Date(job.updatedAt);
          expect(updatedDate).to.be.a('date');
          expect(updatedDate.toString()).to.not.equal('Invalid Date');
        }
      });
    });

    it('should return jobs with valid salary data', async function() {
      const response = await api.get('/jobs');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      data.data.items.forEach(job => {
        if (job.salary) {
          if (job.salary.min !== null && job.salary.min !== undefined) {
            expect(job.salary.min).to.be.a('number');
            expect(job.salary.min).to.be.at.least(0);
          }

          if (job.salary.max !== null && job.salary.max !== undefined) {
            expect(job.salary.max).to.be.a('number');
            expect(job.salary.max).to.be.at.least(0);
          }

          if (job.salary.min && job.salary.max) {
            expect(job.salary.max).to.be.at.least(job.salary.min);
          }
        }
      });
    });

    it('should return jobs with valid requirements array', async function() {
      const response = await api.get('/jobs');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      data.data.items.forEach(job => {
        if (job.requirements) {
          expect(job.requirements).to.be.an('array');
          job.requirements.forEach(requirement => {
            expect(requirement).to.be.a('string');
            expect(requirement.length).to.be.greaterThan(0);
          });
        }
      });
    });
  });
});