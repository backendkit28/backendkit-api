import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  getMetrics,
  getAllUsers,
  getAllSubscriptions,
} from '../services/admin.service';

const prisma = new PrismaClient();

// GET /admin/metrics
export async function metrics(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const data = await getMetrics();
    return reply.status(200).send(data);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Failed to get metrics',
      message: error.message,
    });
  }
}

// GET /admin/users
export async function users(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const data = await getAllUsers();
    return reply.status(200).send({
      total: data.length,
      users: data,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Failed to get users',
      message: error.message,
    });
  }
}

// GET /admin/subscriptions
export async function subscriptions(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const data = await getAllSubscriptions();
    return reply.status(200).send({
      total: data.length,
      subscriptions: data,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Failed to get subscriptions',
      message: error.message,
    });
  }
}

// Mantener las funciones existentes de tenant
export async function createTenant(
  request: FastifyRequest<{ Body: { name: string; plan: string } }>,
  reply: FastifyReply
) {
  // ... tu código existente
}

export async function listTenants(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // ... tu código existente
}