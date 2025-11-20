import * as dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth.routes';
import { tenantRoutes } from './routes/tenant.routes';
import { subscriptionRoutes } from './routes/subscription.routes';
import { webhookRoutes } from './routes/webhook.routes';

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true,
});

// ✅ SEGURIDAD: Helmet para headers HTTP seguros
fastify.register(helmet, {
  contentSecurityPolicy: false, // Desactivado para APIs
  global: true,
});

// ✅ SEGURIDAD: Rate Limiting global
fastify.register(rateLimit, {
  max: 100, // Máximo 100 requests
  timeWindow: '15 minutes', // Por ventana de 15 minutos
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
    };
  },
});

// ✅ SEGURIDAD: CORS mejorado
const frontendUrls = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : [];

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://backendkit.dev',
      'https://www.backendkit.dev',
      'https://app.backendkit.dev',
      ...frontendUrls,
    ].filter((origin) => origin && origin.length > 0)
  : true;

fastify.register(cors, {
  origin: true,  // Temporal
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});

// Ruta raíz
fastify.get('/', async () => {
  return {
    name: 'BackendKit API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
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
    environment: process.env.NODE_ENV || 'development',
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

// ✅ SEGURIDAD: Error handler mejorado
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  // No exponer detalles internos en producción
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Type guard para error
  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error 
    ? (error.statusCode as number) 
    : 500;
  
  const errorMessage = error instanceof Error 
    ? (isDevelopment ? error.message : 'An error occurred')
    : 'An error occurred';
  
  const stack = error instanceof Error && isDevelopment ? error.stack : undefined;

  reply.status(statusCode).send({
    error: 'Internal Server Error',
    message: errorMessage,
    ...(stack && { stack }),
  });
});

// Iniciar servidor
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: Rate limiting & Helmet enabled`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();