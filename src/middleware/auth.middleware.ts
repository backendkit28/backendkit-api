import { FastifyRequest, FastifyReply } from 'fastify';
import { getTenantByApiKey } from '../services/tenant.service';

// Extender el tipo Request para incluir tenant
declare module 'fastify' {
  interface FastifyRequest {
    tenant?: any;
    user?: any;
  }
}

// Middleware para validar API Key
export async function validateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    return reply.status(401).send({
      error: 'API Key is required',
      message: 'Please provide x-api-key header',
    });
  }

  // Validar que el API Key existe
  const tenant = await getTenantByApiKey(apiKey);

  if (!tenant) {
    return reply.status(401).send({
      error: 'Invalid API Key',
      message: 'The provided API Key is not valid',
    });
  }

  // Guardar tenant en el request para usarlo después
  request.tenant = tenant;
}

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware para validar JWT Token
export async function validateJWT(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({
      error: 'Token required',
      message: 'Please provide Authorization header',
    });
  }

  // Extraer token del header "Bearer TOKEN"
  const token = authHeader.replace('Bearer ', '');

  try {
    // Verificar y decodificar token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Guardar info del usuario en el request
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({
      error: 'Invalid token',
      message: 'Token is expired or invalid',
    });
  }
}