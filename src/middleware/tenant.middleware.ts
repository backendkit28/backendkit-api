import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Middleware para validar que el usuario tiene acceso al tenant
// Este middleware debe usarse DESPUÉS de validateJWT
export async function validateTenantOwnership(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // El JWT ya incluye tenantId y userId
  const { userId, tenantId } = request.user;

  if (!userId || !tenantId) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid token data',
    });
  }

  // Verificar que el usuario existe y pertenece al tenant
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: tenantId,
    },
  });

  if (!user) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'User does not have access to this tenant',
    });
  }

  // Verificar que el usuario es owner (para operaciones sensibles)
  // Si necesitas permitir también admins, puedes cambiar esto
  if (user.role !== 'owner' && user.role !== 'admin') {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Only tenant owners and admins can access this resource',
    });
  }

  // Guardar el tenant en el request para uso posterior
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return reply.status(404).send({
      error: 'Not found',
      message: 'Tenant not found',
    });
  }

  request.tenant = tenant;
}

// Middleware más permisivo: solo verifica que el usuario pertenece al tenant
// (sin validar rol de owner)
export async function validateTenantMembership(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userId, tenantId } = request.user;

  if (!userId || !tenantId) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid token data',
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: tenantId,
    },
  });

  if (!user) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'User does not have access to this tenant',
    });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return reply.status(404).send({
      error: 'Not found',
      message: 'Tenant not found',
    });
  }

  request.tenant = tenant;
}
