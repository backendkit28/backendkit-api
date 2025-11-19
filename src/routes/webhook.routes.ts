import { FastifyInstance } from 'fastify';
import { handleStripeWebhook } from '../controllers/webhook.controller';

export async function webhookRoutes(fastify: FastifyInstance) {
  // Stripe necesita el body raw (sin parsear)
  fastify.post('/stripe', {
    config: {
      rawBody: true,
    },
    handler: handleStripeWebhook,
  });
}