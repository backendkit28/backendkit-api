import * as dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth.routes';
import { tenantRoutes } from './routes/tenant.routes';
import { subscriptionRoutes } from './routes/subscription.routes';
import { webhookRoutes } from './routes/webhook.routes';

console.log('🔑 ADMIN_KEY available:', !!process.env.ADMIN_KEY);
console.log('🔑 ADMIN_KEY value:', process.env.ADMIN_KEY?.substring(0, 5) + '...');

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
      useDefaults: true,
      // ✅ Permitir keywords de OpenAPI
      strict: false,
    }
  }
});

// ✅ CORS SIMPLIFICADO
const frontendUrls = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [];

const allowedOrigins = [
  'https://backendkit.dev',
  'https://www.backendkit.dev',
  'https://app.backendkit.dev',
  'https://dashboard.backendkit.dev',
  ...frontendUrls,
].filter(Boolean);

console.log('🌐 Allowed Origins:', allowedOrigins);

fastify.register(cors, {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
});

// ✅ Helmet
fastify.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
});

// ✅ Rate Limiting
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
});

// 📚 SWAGGER DOCUMENTATION
fastify.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'BackendKit API',
      description: 'Backend-as-a-Service - Complete API Documentation',
      version: '1.0.0',
      contact: {
        name: 'BackendKit Support',
        url: 'https://backendkit.dev',
        email: 'support@backendkit.dev'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    externalDocs: {
      url: 'https://docs.backendkit.dev',
      description: 'Find more info here'
    },
    servers: [
      {
        url: 'https://api.backendkit.dev',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      { name: 'System', description: 'System health and info endpoints' },
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Tenants', description: 'Tenant management (Admin only)' },
      { name: 'Subscriptions', description: 'Subscription and payment management' },
      { name: 'Webhooks', description: 'Webhook endpoints for third-party integrations' }
    ],
    components: {
      securitySchemes: {
        adminKey: {
          type: 'apiKey',
          name: 'x-admin-key',
          in: 'header',
          description: 'Admin API key for tenant management'
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'admin', 'owner'] },
            emailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            apiKey: { type: 'string' },
            plan: { type: 'string', enum: ['starter', 'pro', 'agency'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['active', 'canceled', 'past_due', 'trialing'] },
            currentPeriodStart: { type: 'string', format: 'date-time' },
            currentPeriodEnd: { type: 'string', format: 'date-time' },
            cancelAtPeriodEnd: { type: 'boolean' }
          }
        }
      }
    }
  }
});

fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai'
    }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject) => {
    return swaggerObject;
  },
  transformSpecificationClone: true
});

// Root
fastify.get('/', {
  schema: {
    tags: ['System'],
    summary: 'API Information',
    description: 'Returns basic API information and status',
    response: {
      200: {
        description: 'Successful response',
        type: 'object',
        properties: {
          name: { type: 'string' },
          version: { type: 'string' },
          status: { type: 'string' },
          environment: { type: 'string' }
        }
      }
    }
  }
}, async () => {
  return {
    name: 'BackendKit API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    docs: '/docs'
  };
});

// Health check
fastify.get('/health', {
  schema: {
    tags: ['System'],
    summary: 'Health Check',
    description: 'Check API and database health status',
    response: {
      200: {
        description: 'System is healthy',
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'] },
          database: { type: 'string', enum: ['connected', 'disconnected'] },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
}, async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
});

// ✅ Test CORS
fastify.get('/test-cors', {
  schema: {
    tags: ['System'],
    summary: 'CORS Test',
    description: 'Test CORS configuration',
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          timestamp: { type: 'number' }
        }
      }
    }
  }
}, async (request, reply) => {
  reply
    .header('Access-Control-Allow-Origin', '*')
    .header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    .header('Access-Control-Allow-Headers', '*')
    .send({ message: 'CORS test OK', timestamp: Date.now() });
});

// Registrar rutas
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(tenantRoutes, { prefix: '/admin/tenants' });
fastify.register(subscriptionRoutes, { prefix: '/api/subscription' });
fastify.register(webhookRoutes, { prefix: '/webhooks' });

// Error handler
fastify.setErrorHandler((error: any, request, reply) => {
  fastify.log.error(error);
  const isDev = process.env.NODE_ENV !== 'production';
  reply.status(error?.statusCode || 500).send({
    error: 'Internal Server Error',
    message: isDev ? error?.message : 'An error occurred',
    ...(isDev ? { stack: error?.stack } : {}),
  });
});

// Start
const start = async () => {
  try {
    const port = Number(process.env.PORT || 3000);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
    console.log(`📚 Swagger UI: http://localhost:${port}/docs`);
  } catch (e) {
    fastify.log.error(e);
    process.exit(1);
  }
};

start();