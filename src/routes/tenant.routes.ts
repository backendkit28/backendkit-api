import { FastifyInstance } from 'fastify';
import { validateAdminKey } from '../middleware/admin.middleware';
import { create, list } from '../controllers/tenant.controller';
import {
  metrics,
  users,
  subscriptions,
} from '../controllers/admin.controller';

export async function tenantRoutes(fastify: FastifyInstance) {
  // Rutas de tenants
  fastify.post('/', {
    preHandler: [validateAdminKey],
    handler: create,
  });

  fastify.get('/', {
    preHandler: [validateAdminKey],
    handler: list,
  });

  // Rutas de métricas y admin
  fastify.get('/metrics', {
    preHandler: [validateAdminKey],
    handler: metrics,
  });

  fastify.get('/users', {
    preHandler: [validateAdminKey],
    handler: users,
  });

  fastify.get('/subscriptions', {
    preHandler: [validateAdminKey],
    handler: subscriptions,
  });
}