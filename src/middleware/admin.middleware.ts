import { FastifyRequest, FastifyReply } from 'fastify';

const ADMIN_KEY = process.env.ADMIN_KEY || 'super-secret-admin-key';

export async function validateAdminKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const adminKey = request.headers['x-admin-key'] as string;
  
  console.log('Received key:', adminKey);
  console.log('Expected key:', ADMIN_KEY);
  console.log('Match:', adminKey === ADMIN_KEY);

  if (!adminKey || adminKey !== ADMIN_KEY) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Invalid admin key',
    });
  }
}
