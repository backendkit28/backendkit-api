import { FastifyInstance } from 'fastify';
import { validateJWT } from '../middleware/auth.middleware';
import {
  create,
  list,
  cancel,
  portal,
} from '../controllers/subscription.controller';

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // Todas requieren JWT
  fastify.post('/create', {
    preHandler: [validateJWT],
    handler: create,
  });

  fastify.get('/list', {
    preHandler: [validateJWT],
    handler: list,
  });

  fastify.post('/:subscriptionId/cancel', {
    preHandler: [validateJWT],
    handler: cancel,
  });

  fastify.post('/portal', {
    preHandler: [validateJWT],
    handler: portal,
  });
}