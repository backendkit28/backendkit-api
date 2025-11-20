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

console.log('🔑 ADMIN_KEY available:', !!process.env.ADMIN_KEY);
console.log(
  '🔑 ADMIN_KEY value:',
  process.env.ADMIN_KEY ? process.env.ADMIN_KEY.substring(0, 5) + '...' : 'undefined'
);

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true,
});

// Manejo especial para OPTIONS
fastify.addHook('onRequest', async (request, reply) => {
  if (request.method === 'OPTIONS') {
    reply
      .header('Access-Control-Allow-Origin', request.headers.origin || '*')
      .header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS')
      .header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-admin-key')
      .header('Access-Control-Allow-Credentials', 'true')
      .status(204)
      .send();
    return;
  }
});

// CORS en Fastify
fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
});

// Seguridad: Helmet
fastify.register(helmet, {
  contentSecurityPolicy: false,
  global: true,
});

// Rate Limiting
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
    };
  },
});

// Lista de orígenes permitidos en producción
const frontendUrls = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : [];

const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [
        'https://backendkit.dev',
        'https://www.backendkit.dev',
        'https://app.backendkit.dev',
        ...frontendUrls,
      ].filter((origin) => origin && origin.length > 0)
    : true;

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

// Healthcheck
fastify.get('/health', async () => {
  const checks: Record<string, string> = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    database: 'checking...',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch {
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

// Error handler GENERAL — FIX al error “error is unknown”
fastify.setErrorHandler(
  (
    error: unknown, // <— TypeScript ya no marca error aquí
    request,
    reply
  ) => {
    fastify.log.error(error);

    const isDev = process.env.NODE_ENV !== 'production';

    let message = 'An error occurred';
    let stack;

    // Si viene un Error real, obtenemos datos seguros
    if (error instanceof Error) {
      message = isDev ? error.message : 'An error occurred';
      stack = isDev ? error.stack : undefined;
    }

    reply.status(500).send({
      error: 'Internal Server Error',
      message,
      ...(stack && { stack }),
    });
  }
);

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
