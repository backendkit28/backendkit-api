import { FastifyInstance } from 'fastify';
import { validateApiKey, validateJWT } from '../middleware/auth.middleware';
import {
  register,
  login,
  getMe,
  updatePassword,
  googleLogin,
  googleCallback,
  githubLogin,
  githubCallback,
} from '../controllers/auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  // Rutas públicas (solo requieren API Key)
  fastify.post('/register', {
    preHandler: [validateApiKey],
    handler: register,
  });

  fastify.post('/login', {
    preHandler: [validateApiKey],
    handler: login,
  });

  // Rutas protegidas (requieren JWT)
  fastify.get('/me', {
    preHandler: [validateJWT],
    handler: getMe,
  });

  fastify.put('/change-password', {
    preHandler: [validateJWT],
    handler: updatePassword,
  });

  // OAuth - Google (sin middleware, valida API Key internamente)
  fastify.get('/google', {
    handler: googleLogin,
  });

  fastify.get('/google/callback', {
    handler: googleCallback,
  });

  // OAuth - GitHub (sin middleware, valida API Key internamente)
  fastify.get('/github', {
    handler: githubLogin,
  });

  fastify.get('/github/callback', {
    handler: githubCallback,
  });
}