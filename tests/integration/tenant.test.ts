import { buildTestServer } from '../helper';
import { FastifyInstance } from 'fastify';

describe('Tenant Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildTestServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /admin/tenants', () => {
    it('should return 403 without admin key', async () => {  // ✅ Cambiar a 403
      const response = await server.inject({
        method: 'POST',
        url: '/admin/tenants',
        payload: {
          name: 'Test Tenant',
          email: 'test@tenant.com',
        },
      });

      expect(response.statusCode).toBe(403);  // ✅ Cambiar a 403
    });

    it('should return 400 without name', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/admin/tenants',
        headers: {
          'x-admin-key': 'test-admin-key',
        },
        payload: {
          email: 'test@tenant.com',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /admin/tenants', () => {
    it('should return 403 without admin key', async () => {  // ✅ Cambiar a 403
      const response = await server.inject({
        method: 'GET',
        url: '/admin/tenants',
      });

      expect(response.statusCode).toBe(403);  // ✅ Cambiar a 403
    });
  });

  describe('GET /admin/tenants/metrics', () => {
    it('should return 403 without admin key', async () => {  // ✅ Cambiar a 403
      const response = await server.inject({
        method: 'GET',
        url: '/admin/tenants/metrics',
      });

      expect(response.statusCode).toBe(403);  // ✅ Cambiar a 403
    });
  });

  describe('GET /admin/tenants/users', () => {
    it('should return 403 without admin key', async () => {  // ✅ Cambiar a 403
      const response = await server.inject({
        method: 'GET',
        url: '/admin/tenants/users',
      });

      expect(response.statusCode).toBe(403);  // ✅ Cambiar a 403
    });
  });

  describe('GET /admin/tenants/subscriptions', () => {
    it('should return 403 without admin key', async () => {  // ✅ Cambiar a 403
      const response = await server.inject({
        method: 'GET',
        url: '/admin/tenants/subscriptions',
      });

      expect(response.statusCode).toBe(403);  // ✅ Cambiar a 403
    });
  });
});