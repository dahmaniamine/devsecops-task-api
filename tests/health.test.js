const request = require('supertest');
const app = require('../src/app');

describe('Health endpoint', () => {
  test('GET /health returns 200 and service status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('devsecops-task-api');
    expect(response.body.timestamp).toBeDefined();
  });
});
