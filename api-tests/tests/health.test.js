import { expect } from 'chai';
import { api, waitForApi } from '../utils/testUtils.js';

describe('Health API Tests', function() {

  before(async function() {
    this.timeout(30000);
    console.log('🔍 Checking if API is ready...');
    await waitForApi();
  });

  describe('GET /api/health', function() {
    it('should return healthy status', async function() {
      const response = await api.get('/health');

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('object');
      expect(response.data.status).to.equal('healthy');
      expect(response.data.message).to.include('HireThemNow API');
      expect(response.data.timestamp).to.be.a('string');
      expect(response.data.environment).to.be.a('string');
    });

    it('should have current timestamp', async function() {
      const response = await api.get('/health');

      const timestamp = new Date(response.data.timestamp.replace(' UTC', 'Z'));
      const now = new Date();
      const diffMinutes = Math.abs(now - timestamp) / (1000 * 60);

      // Timestamp should be within 5 minutes of current time
      expect(diffMinutes).to.be.lessThan(5);
    });
  });

  describe('GET /api/health/test', function() {
    it('should return test endpoint response', async function() {
      const response = await api.get('/health/test');

      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('object');
      expect(response.data.message).to.equal('Test endpoint working');
      expect(response.data.success).to.equal(true);
    });
  });

  describe('Health API Error Handling', function() {
    it('should return HTML fallback for non-existent health endpoint', async function() {
      // This endpoint returns HTML fallback instead of 404 due to SPA routing
      const response = await api.get('/health/nonexistent');

      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('text/html');
      expect(response.data).to.include('HireThemNow');
    });
  });
});