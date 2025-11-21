import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from '../src/routes/auth.routes';
import { tenantRoutes } from '../src/routes/tenant.routes';
import { subscriptionRoutes } from '../src/routes/subscription.routes';
import { webhookRoutes } from '../src/routes/webhook.routes';

const prisma = new PrismaClient();

export async function buildTestServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false, // Desactivar logs en tests
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
        strict: false,
      }
    }
  });

  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Swagger (opcional en tests)
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'BackendKit API Test',
        version: '1.0.0',
      },
    },
  });

  // ✅ AGREGAR ENDPOINT ROOT
  fastify.get('/', async () => {
    return {
      name: 'BackendKit API',
      version: '1.0.0',
      status: 'running',
      environment: 'test',
    };
  });

  // ✅ AGREGAR HEALTH CHECK
  fastify.get('/health', async () => {
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

  // Registrar rutas
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(tenantRoutes, { prefix: '/admin/tenants' });
  await fastify.register(subscriptionRoutes, { prefix: '/api/subscription' });
  await fastify.register(webhookRoutes, { prefix: '/webhooks' });

  return fastify;
}