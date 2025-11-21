import { FastifyInstance } from 'fastify';
import { validateJWT } from '../middleware/auth.middleware';
import {
  create,
  list,
  cancel,
  portal,
} from '../controllers/subscription.controller';

export async function subscriptionRoutes(fastify: FastifyInstance) {
  // ========================================
  // 💳 CREATE SUBSCRIPTION
  // ========================================
  fastify.post('/create', {
    schema: {
      tags: ['Subscriptions'],
      summary: 'Create subscription',
      description: 'Creates a new Stripe subscription for the authenticated user',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['priceId'],
        properties: {
          priceId: {
            type: 'string',
            description: 'Stripe price ID',
            example: 'price_1234567890abcdef'
          },
          paymentMethodId: {
            type: 'string',
            description: 'Stripe payment method ID (optional)',
            example: 'pm_1234567890abcdef'
          }
        }
      },
      response: {
        200: {
          description: 'Subscription created successfully',
          type: 'object',
          properties: {
            subscriptionId: { 
              type: 'string',
              example: 'sub_1234567890abcdef'
            },
            clientSecret: { 
              type: 'string',
              description: 'Client secret for payment confirmation',
              example: 'pi_1234567890_secret_abcdefghijklmnop'
            },
            status: {
              type: 'string',
              example: 'active'
            }
          }
        },
        400: {
          description: 'Invalid request',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid price ID' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid or missing JWT token' }
          }
        }
      }
    },
    preHandler: [validateJWT],
    handler: create,
  });

  // ========================================
  // 📋 LIST SUBSCRIPTIONS
  // ========================================
  fastify.get('/list', {
    schema: {
      tags: ['Subscriptions'],
      summary: 'List user subscriptions',
      description: 'Returns all subscriptions for the authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Subscriptions retrieved successfully',
          type: 'object',
          properties: {
            subscriptions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  stripeSubscriptionId: { type: 'string' },
                  stripePriceId: { type: 'string' },
                  status: { 
                    type: 'string',
                    example: 'active'
                  },
                  currentPeriodStart: { type: 'string', format: 'date-time' },
                  currentPeriodEnd: { type: 'string', format: 'date-time' },
                  cancelAtPeriodEnd: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid or missing JWT token' }
          }
        }
      }
    },
    preHandler: [validateJWT],
    handler: list,
  });

  // ========================================
  // ❌ CANCEL SUBSCRIPTION
  // ========================================
  fastify.post('/:subscriptionId/cancel', {
    schema: {
      tags: ['Subscriptions'],
      summary: 'Cancel subscription',
      description: 'Cancels a subscription at the end of the billing period',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['subscriptionId'],
        properties: {
          subscriptionId: {
            type: 'string',
            format: 'uuid',
            description: 'Subscription ID to cancel'
          }
        }
      },
      response: {
        200: {
          description: 'Subscription cancelled successfully',
          type: 'object',
          properties: {
            message: { 
              type: 'string',
              example: 'Subscription will be cancelled at period end'
            },
            subscription: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { type: 'string', example: 'active' },
                cancelAtPeriodEnd: { type: 'boolean', example: true },
                currentPeriodEnd: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        404: {
          description: 'Subscription not found',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Subscription not found' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid or missing JWT token' }
          }
        }
      }
    },
    preHandler: [validateJWT],
    handler: cancel,
  });

  // ========================================
  // 🏦 BILLING PORTAL
  // ========================================
  fastify.post('/portal', {
    schema: {
      tags: ['Subscriptions'],
      summary: 'Get billing portal URL',
      description: 'Creates a Stripe billing portal session for the user',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          returnUrl: {
            type: 'string',
            format: 'uri',
            description: 'URL to redirect after portal session',
            example: 'https://app.backendkit.dev/billing'
          }
        }
      },
      response: {
        200: {
          description: 'Portal URL created successfully',
          type: 'object',
          properties: {
            url: { 
              type: 'string',
              format: 'uri',
              description: 'Stripe billing portal URL',
              example: 'https://billing.stripe.com/session/...'
            }
          }
        },
        400: {
          description: 'No customer found',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'No Stripe customer found' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid or missing JWT token' }
          }
        }
      }
    },
    preHandler: [validateJWT],
    handler: portal,
  });
}