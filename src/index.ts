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

// Debug keys
console.log('🔑 ADMIN_KEY available:', !!process.env.ADMIN_KEY);
console.log('🔑 ADMIN_KEY value:', process.env.ADMIN_KEY?.substring(0, 5) + '...');

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true,
});

/* -------------------------------------------------------
   🌐 CORS CONFIG LIMPIO Y CORRECTO
--------------------------------------------------------*/

const frontendUrlsEnv = process.env.FRONTEND_URL || '';
const extraAllowed = frontendUrlsEnv.split(',')
  .map((u) => u.trim())
  .filter(Boolean);

const allowedOrigins = [
  'https://backendkit.dev',
  'https://www.backendkit.dev',
  'https://app.backendkit.dev',
  'https://dashboard.backendkit.dev',   // <-- agregado
  ...extraAllowed,
];

console.log('🌐 Allowed Origins:', allowedOrigins);

// Registrar CORS
fastify.register(cors, {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
});

// ✅ Helmet después (sin crossOrigin restrictions)
fastify.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
});

fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
});

/* -------------------------------------------------------
   🏠 Rutas base
--------------------------------------------------------*/
fastify.get('/', async () => {
  return {
    name: 'BackendKit API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
  };
});

fastify.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch (e) {
    return {
      status: 'degraded',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
});

/* -------------------------------------------------------
   📌 Registrar rutas
--------------------------------------------------------*/
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(tenantRoutes, { prefix: '/admin/tenants' });
fastify.register(subscriptionRoutes, { prefix: '/api/subscription' });

// Webhooks deben ir al final
fastify.register(webhookRoutes, { prefix: '/webhooks' });

/* -------------------------------------------------------
   ❗ Global Error Handler (corrige error TS: unknown)
--------------------------------------------------------*/
fastify.setErrorHandler((error: any, request, reply) => {
  fastify.log.error(error);

  const isDev = process.env.NODE_ENV !== 'production';

  reply.status(error?.statusCode || 500).send({
    error: 'Internal Server Error',
    message: isDev ? error?.message : 'An error occurred',
    ...(isDev ? { stack: error?.stack } : {}),
  });
});

/* -------------------------------------------------------
   🚀 Start Server
--------------------------------------------------------*/
const start = async () => {
  try {
    const port = Number(process.env.PORT || 3000);
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  } catch (e) {
    fastify.log.error(e);
    process.exit(1);
  }
};

start();