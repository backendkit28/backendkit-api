import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createTenant,
  getAllTenants,
} from '../services/tenant.service';

interface CreateTenantBody {
  name: string;
  email: string;
}

// POST /admin/tenants
export async function create(
  request: FastifyRequest<{ Body: CreateTenantBody }>,
  reply: FastifyReply
) {
  try {
    const { name, email } = request.body;

    if (!name || !email) {
      return reply.status(400).send({
        error: 'Missing fields',
        message: 'Name and email are required',
      });
    }

    const tenant = await createTenant(name, email);

    return reply.status(201).send(tenant);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to create tenant',
    });
  }
}

// GET /admin/tenants
export async function list(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const tenants = await getAllTenants();

    return reply.status(200).send({
      total: tenants.length,
      tenants,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to list tenants',
    });
  }
}