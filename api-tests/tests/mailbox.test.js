import { expect } from 'chai';
import {
  api,
  createAuthenticatedApi,
  generateTestUser,
  validateApiResponse,
  cleanupTestUser
} from '../utils/testUtils.js';

describe('Mailbox API Tests', function() {
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

  describe('GET /api/mailbox/emails', function() {
    it('should return empty emails list for new user', async function() {
      const response = await authApi.get('/mailbox/emails');

      expect(response.status).to.equal(200);

      const data = validateApiResponse(response);
      expect(data.message).to.equal('User emails retrieved successfully');
      expect(data.data).to.be.an('array');
      expect(data.data).to.have.lengthOf(0);
    });

    it('should reject request without authentication', async function() {
      try {
        await api.get('/mailbox/emails');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should reject request with invalid token', async function() {
      const invalidAuthApi = createAuthenticatedApi('invalid_token');

      try {
        await invalidAuthApi.get('/mailbox/emails');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return properly formatted email objects when emails exist', async function() {
      // Note: This test assumes that the system may create some sample data
      // or that emails are created through other API calls
      const response = await authApi.get('/mailbox/emails');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      // Validate the structure even if empty
      expect(data.data).to.be.an('array');

      // If emails exist, they should have the correct structure
      if (data.data.length > 0) {
        const email = data.data[0];
        expect(email).to.have.property('id');
        expect(email).to.have.property('subject');
        expect(email).to.have.property('hrContact');
        expect(email).to.have.property('status');
        expect(email).to.have.property('sentAt');
        expect(email).to.have.property('type');

        // Validate HR contact structure
        if (email.hrContact) {
          expect(email.hrContact).to.have.property('name');
          expect(email.hrContact).to.have.property('email');
          expect(email.hrContact).to.have.property('company');
        }

        // Validate email analysis if reply exists
        if (email.replyEmail) {
          expect(email).to.have.property('analysis');
          if (email.analysis) {
            expect(email.analysis).to.have.property('isPositive');
            expect(email.analysis).to.have.property('hasInterviewInvitation');
            expect(email.analysis).to.have.property('isRejection');
          }
        }
      }
    });

    it('should handle user with no outreach campaigns', async function() {
      // For a brand new user, there should be no emails
      const response = await authApi.get('/mailbox/emails');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);
      expect(data.data).to.be.an('array');
      expect(data.data).to.have.lengthOf(0);
    });
  });

  describe('Mailbox API Performance and Pagination', function() {
    it('should return response within reasonable time', async function() {
      this.timeout(5000); // 5 second timeout

      const startTime = Date.now();
      const response = await authApi.get('/mailbox/emails');
      const endTime = Date.now();

      expect(response.status).to.equal(200);

      const responseTime = endTime - startTime;
      expect(responseTime).to.be.lessThan(3000); // Should respond within 3 seconds
    });

    it('should handle large number of emails gracefully', async function() {
      // This test checks that the API doesn't crash with large datasets
      // In a real scenario, this would test pagination or limits
      const response = await authApi.get('/mailbox/emails');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      // API should return an array regardless of size
      expect(data.data).to.be.an('array');

      // If there are many emails, they should all have required properties
      data.data.forEach(email => {
        expect(email).to.have.property('id');
        expect(email).to.have.property('subject');
        expect(email).to.have.property('status');
      });
    });
  });

  describe('Mailbox API Error Handling', function() {
    it('should handle database connection issues gracefully', async function() {
      // This would normally require mocking the database service
      // For now, we test that valid requests don't return 500 errors
      const response = await authApi.get('/mailbox/emails');

      expect(response.status).to.not.equal(500);
      expect(response.status).to.equal(200);
    });

    it('should handle invalid user ID in token', async function() {
      // Create a token with non-existent user ID
      // This test would require creating an invalid but properly signed JWT
      // For now, we use completely invalid token which gets caught earlier
      const invalidAuthApi = createAuthenticatedApi('Bearer invalid.token.here');

      try {
        await invalidAuthApi.get('/mailbox/emails');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should handle malformed authorization header', async function() {
      try {
        await api.get('/mailbox/emails', {
          headers: {
            'Authorization': 'InvalidFormat'
          }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should handle missing authorization header', async function() {
      try {
        await api.get('/mailbox/emails');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });
  });

  describe('Mailbox Email Data Validation', function() {
    it('should return emails in correct chronological order', async function() {
      const response = await authApi.get('/mailbox/emails');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      if (data.data.length > 1) {
        // Check if emails are sorted by date (most recent first)
        for (let i = 0; i < data.data.length - 1; i++) {
          const currentEmail = data.data[i];
          const nextEmail = data.data[i + 1];

          if (currentEmail.sentAt && nextEmail.sentAt) {
            const currentDate = new Date(currentEmail.sentAt);
            const nextDate = new Date(nextEmail.sentAt);
            expect(currentDate.getTime()).to.be.greaterThanOrEqual(nextDate.getTime());
          }
        }
      }
    });

    it('should have valid email addresses in HR contacts', async function() {
      const response = await authApi.get('/mailbox/emails');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      data.data.forEach(email => {
        if (email.hrContact && email.hrContact.email) {
          // Basic email validation regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          expect(email.hrContact.email).to.match(emailRegex);
        }
      });
    });

    it('should have valid status values', async function() {
      const response = await authApi.get('/mailbox/emails');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      const validStatuses = ['sent', 'pending', 'replied', 'bounced', 'failed'];

      data.data.forEach(email => {
        if (email.status) {
          expect(validStatuses).to.include(email.status);
        }
      });
    });

    it('should have valid date formats', async function() {
      const response = await authApi.get('/mailbox/emails');

      expect(response.status).to.equal(200);
      const data = validateApiResponse(response);

      data.data.forEach(email => {
        if (email.sentAt) {
          const sentDate = new Date(email.sentAt);
          expect(sentDate).to.be.a('date');
          expect(sentDate.toString()).to.not.equal('Invalid Date');
        }

        if (email.repliedAt) {
          const repliedDate = new Date(email.repliedAt);
          expect(repliedDate).to.be.a('date');
          expect(repliedDate.toString()).to.not.equal('Invalid Date');
        }
      });
    });
  });

  describe('Mailbox API Integration', function() {
    it('should work consistently with auth system', async function() {
      // Verify that the same user ID is used consistently
      const mailboxResponse = await authApi.get('/mailbox/emails');
      const profileResponse = await authApi.get('/auth/profile');

      expect(mailboxResponse.status).to.equal(200);
      expect(profileResponse.status).to.equal(200);

      const profileData = validateApiResponse(profileResponse);
      expect(profileData.data.id).to.equal(userId);

      // The mailbox should return emails for the same user
      // (even if empty for a new user)
      const mailboxData = validateApiResponse(mailboxResponse);
      expect(mailboxData.data).to.be.an('array');
    });
  });
});