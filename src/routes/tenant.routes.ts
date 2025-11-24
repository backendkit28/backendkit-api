import { FastifyInstance } from 'fastify';
import { validateAdminKey } from '../middleware/admin.middleware';
import { create, list } from '../controllers/tenant.controller';
import {
  metrics,
  users,
  subscriptions,
} from '../controllers/admin.controller';

export async function tenantRoutes(fastify: FastifyInstance) {
  // ========================================
  // 🏢 CREATE TENANT
  // ========================================
  fastify.post('/', {
    schema: {
      tags: ['Tenants'],
      summary: 'Create tenant',
      description: 'Creates a new tenant (client) with API key. Admin only.',
      security: [{ adminKey: [] }],
      body: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: {
            type: 'string',
            description: 'Tenant/company name',
            example: 'Acme Corp'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Tenant contact email',
            example: 'admin@acme.com'
          },
          plan: {
            type: 'string',
            description: 'Subscription plan',
            example: 'starter'
          }
        }
      },
      response: {
        201: {
          description: 'Tenant created successfully',
          type: 'object',
          properties: {
            tenant: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                apiKey: { 
                  type: 'string',
                  description: 'Generated API key for tenant',
                  example: 'bk_1234567890abcdef'
                },
                plan: { type: 'string', example: 'starter' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            message: { type: 'string', example: 'Tenant created successfully' }
          }
        },
        400: {
          description: 'Invalid input',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Tenant name is required' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid admin key',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid admin key' }
          }
        }
      }
    },
    preHandler: [validateAdminKey],
    handler: create,
  });

  // ========================================
  // 📋 LIST TENANTS
  // ========================================
  fastify.get('/', {
    schema: {
      tags: ['Tenants'],
      summary: 'List all tenants',
      description: 'Returns a list of all tenants. Admin only.',
      security: [{ adminKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'Page number',
            example: 1
          },
          limit: {
            type: 'integer',
            description: 'Items per page',
            example: 10
          }
        }
      },
      response: {
        200: {
          description: 'Tenants retrieved successfully',
          type: 'object',
          properties: {
            tenants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  apiKey: { type: 'string' },
                  plan: { type: 'string' },
                  stripeCustomerId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            total: { type: 'integer', example: 42 },
            page: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 5 }
          }
        },
        401: {
          description: 'Unauthorized - Invalid admin key',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid admin key' }
          }
        }
      }
    },
    preHandler: [validateAdminKey],
    handler: list,
  });

  // ========================================
  // 📊 METRICS
  // ========================================
  fastify.get('/metrics', {
    schema: {
      tags: ['Tenants'],
      summary: 'Get platform metrics',
      description: 'Returns overall platform metrics and statistics. Admin only.',
      security: [{ adminKey: [] }],
      response: {
        200: {
          description: 'Metrics retrieved successfully',
          type: 'object',
          properties: {
            totalTenants: { type: 'integer', example: 42 },
            totalUsers: { type: 'integer', example: 1337 },
            totalSubscriptions: { type: 'integer', example: 89 },
            activeSubscriptions: { type: 'integer', example: 67 },
            mrr: { type: 'number', example: 299.99 },
            churnRate: { type: 'number', example: 5.2 },
            newUsersLast30Days: { type: 'integer', example: 150 },
            userGrowth: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', example: '2025-11-24' },
                  users: { type: 'integer', example: 15 }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Invalid admin key',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid admin key' }
          }
        }
      }
    },
    preHandler: [validateAdminKey],
    handler: metrics,
  });

  // ========================================
  // 👥 USERS
  // ========================================
  fastify.get('/users', {
    schema: {
      tags: ['Tenants'],
      summary: 'List all users',
      description: 'Returns all users across all tenants. Admin only.',
      security: [{ adminKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 50 },
          tenantId: { 
            type: 'string',
            format: 'uuid',
            description: 'Filter by tenant ID'
          }
        }
      },
      response: {
        200: {
          description: 'Users retrieved successfully',
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', example: 'user' },
                  emailVerified: { type: 'boolean' },
                  tenantId: { type: 'string', format: 'uuid' },
                  tenantName: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            total: { type: 'integer', example: 1337 },
            page: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 27 }
          }
        },
        401: {
          description: 'Unauthorized - Invalid admin key',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid admin key' }
          }
        }
      }
    },
    preHandler: [validateAdminKey],
    handler: users,
  });

  // ========================================
  // 💳 SUBSCRIPTIONS
  // ========================================
  fastify.get('/subscriptions', {
    schema: {
      tags: ['Tenants'],
      summary: 'List all subscriptions',
      description: 'Returns all subscriptions across all tenants. Admin only.',
      security: [{ adminKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 50 },
          status: {
            type: 'string',
            description: 'Filter by status',
            example: 'active'
          }
        }
      },
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
                  tenantId: { type: 'string', format: 'uuid' },
                  tenantName: { type: 'string' },
                  userId: { type: 'string', format: 'uuid' },
                  userEmail: { type: 'string', format: 'email' },
                  stripeSubscriptionId: { type: 'string' },
                  status: { type: 'string', example: 'active' },
                  currentPeriodEnd: { type: 'string', format: 'date-time' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            total: { type: 'integer', example: 89 },
            page: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 2 }
          }
        },
        401: {
          description: 'Unauthorized - Invalid admin key',
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid admin key' }
          }
        }
      }
    },
    preHandler: [validateAdminKey],
    handler: subscriptions,
  });
}