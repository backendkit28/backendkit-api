import { FastifyInstance } from 'fastify';
import { handleStripeWebhook } from '../controllers/webhook.controller';

export async function webhookRoutes(fastify: FastifyInstance) {
  // ========================================
  // 🔔 STRIPE WEBHOOK
  // ========================================
  fastify.post('/stripe', {
    schema: {
      tags: ['Webhooks'],
      summary: 'Stripe webhook handler',
      description: 'Receives and processes Stripe webhook events (payment succeeded, subscription updated, etc.). Note: This endpoint requires raw body for signature verification.',
      headers: {
        type: 'object',
        properties: {
          'stripe-signature': {
            type: 'string',
            description: 'Stripe webhook signature for verification'
          }
        }
      },
      body: {
        type: 'object',
        description: 'Stripe event object',
        properties: {
          id: { 
            type: 'string',
            description: 'Stripe event ID',
            example: 'evt_1234567890abcdef' 
          },
          type: { 
            type: 'string',
            description: 'Event type',
            example: 'payment_intent.succeeded'
          },
          data: {
            type: 'object',
            description: 'Event data from Stripe',
            additionalProperties: true
          },
          created: {
            type: 'number',
            description: 'Timestamp of event creation',
            example: 1234567890
          }
        }
      },
      response: {
        200: {
          description: 'Webhook processed successfully',
          type: 'object',
          properties: {
            received: { 
              type: 'boolean',
              example: true 
            },
            eventId: { 
              type: 'string',
              example: 'evt_1234567890abcdef' 
            }
          }
        },
        400: {
          description: 'Invalid signature or malformed webhook',
          type: 'object',
          properties: {
            error: { 
              type: 'string',
              example: 'Webhook signature verification failed' 
            }
          }
        },
        500: {
          description: 'Error processing webhook',
          type: 'object',
          properties: {
            error: { 
              type: 'string',
              example: 'Failed to process webhook event' 
            }
          }
        }
      }
    },
    bodyLimit: 1048576, // 1MB limit
    handler: handleStripeWebhook
  });
}