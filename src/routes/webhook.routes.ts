import { FastifyInstance } from 'fastify';
import { handleStripeWebhook } from '../controllers/webhook.controller';

export async function webhookRoutes(fastify: FastifyInstance) {
  // Stripe necesita el body raw (sin parsear) para verificar la firma
  fastify.post(
    '/stripe',
    {
      bodyLimit: 1048576, // 1MB límite
    },
    handleStripeWebhook
  );
}