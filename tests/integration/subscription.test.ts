import { buildTestServer } from '../helper';
import { FastifyInstance } from 'fastify';

describe('Subscription Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildTestServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /api/subscription/create', () => {
    it('should return 401 without JWT token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/subscription/create',
        payload: {
          priceId: 'price_123',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 without priceId', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/subscription/create',
        headers: {
          authorization: 'Bearer fake-token',
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/subscription/list', () => {
    it('should return 401 without JWT token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/subscription/list',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/subscription/:subscriptionId/cancel', () => {
    it('should return 400 with invalid UUID format', async () => {  // ✅ Cambiar descripción y expectativa
      const response = await server.inject({
        method: 'POST',
        url: '/api/subscription/invalid-uuid/cancel',
      });

      expect(response.statusCode).toBe(400);  // ✅ Cambiar a 400
    });
  });

  describe('POST /api/subscription/portal', () => {
    it('should return 400 without body', async () => {  // ✅ Cambiar descripción
      const response = await server.inject({
        method: 'POST',
        url: '/api/subscription/portal',
      });

      expect(response.statusCode).toBe(400);  // ✅ Cambiar a 400
    });
  });
});