import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { authRoutes } from './routes/auth.routes';
import { tenantRoutes } from './routes/tenant.routes';
import { subscriptionRoutes } from './routes/subscription.routes';
import { webhookRoutes } from './routes/webhook.routes';

dotenv.config();

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true,
});

// CORS
fastify.register(cors, {
  origin: true,
});

// Ruta raíz
fastify.get('/', async () => {
  return {
    name: 'BackendKit API',
    version: '1.0.0',
    status: 'running',
    documentation: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        changePassword: 'PUT /api/auth/change-password',
        googleOAuth: 'GET /api/auth/google',
        githubOAuth: 'GET /api/auth/github',
      },
      subscriptions: {
        create: 'POST /api/subscription/create',
        list: 'GET /api/subscription/list',
        cancel: 'POST /api/subscription/:id/cancel',
        portal: 'POST /api/subscription/portal',
      },
      admin: {
        createTenant: 'POST /admin/tenants',
        listTenants: 'GET /admin/tenants',
      },
      webhooks: {
        stripe: 'POST /webhooks/stripe',
      },
    },
  };
});

// Health check
fastify.get('/health', async () => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    database: 'checking...',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch (error) {
    checks.database = 'disconnected';
    checks.status = 'degraded';
  }

  return checks;
});

// Registrar rutas
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(tenantRoutes, { prefix: '/admin/tenants' });
fastify.register(subscriptionRoutes, { prefix: '/api/subscription' });
fastify.register(webhookRoutes, { prefix: '/webhooks' });

// Error handler - ✅ CORREGIDO
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  // Manejar el error de forma segura
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  reply.status(500).send({
    error: 'Internal Server Error',
    message: errorMessage,
  });
});

// Iniciar servidor
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();