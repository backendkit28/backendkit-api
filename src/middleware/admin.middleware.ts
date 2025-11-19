import { FastifyRequest, FastifyReply } from 'fastify';

const ADMIN_KEY = process.env.ADMIN_KEY || 'super-secret-admin-key';

export async function validateAdminKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const adminKey = request.headers['x-admin-key'] as string;

  if (!adminKey || adminKey !== ADMIN_KEY) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Invalid admin key',
    });
  }
}