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

// Debug
console.log('🔑 ADMIN_KEY available:', !!process.env.ADMIN_KEY);

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

/* -------------------------------------------------------
   🌐 CORS CONFIG CORRECTA PARA FASTIFY 5
--------------------------------------------------------*/

const frontendUrlsEnv = process.env.FRONTEND_URL || '';
const extraAllowed = frontendUrlsEnv.split(',').map(u => u.trim()).filter(Boolean);

const allowedOrigins = [
  'https://backendkit.dev',
  'https://www.backendkit.dev',
  'https://app.backendkit.dev',
  'https://dashboard.backendkit.dev',
  ...extraAllowed,
];

console.log('🌐 Allowed Origins:', allowedOrigins);

fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman/cURL ok

    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    console.error("❌ CORS blocked:", origin);
    return cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 600,
});

/* -------------------------------------------------------
   🛡 Seguridad
--------------------------------------------------------*/
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
fastify.get('/', async () => ({
  name: 'BackendKit API',
  version: '1.0.0',
  status: 'running',
  environment: process.env.NODE_ENV || 'development',
}));

fastify.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  } catch {
    return { status: 'degraded', database: 'disconnected', timestamp: new Date().toISOString() };
  }
});

/* -------------------------------------------------------
   📌 Registrar rutas
--------------------------------------------------------*/
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(tenantRoutes, { prefix: '/admin/tenants' });
fastify.register(subscriptionRoutes, { prefix: '/api/subscription' });

// Webhooks al final
fastify.register(webhookRoutes, { prefix: '/webhooks' });

/* -------------------------------------------------------
   ❗ Global Error Handler
--------------------------------------------------------*/
fastify.setErrorHandler((err, request, reply) => {
  const error = err as any;  // 👈 Solución

  fastify.log.error(error);

  const isDev = process.env.NODE_ENV !== 'production';

  reply.status(error.statusCode || 500).send({
    error: 'Internal Server Error',
    message: isDev ? error.message : 'An error occurred',
    ...(isDev ? { stack: error.stack } : {}),
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
  } catch (e) {
    fastify.log.error(e);
    process.exit(1);
  }
};

start();