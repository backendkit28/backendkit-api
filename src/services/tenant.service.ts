import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generar API Key única para cada tenant
function generateApiKey(): string {
  const randomString = crypto.randomBytes(32).toString('hex');
  return `bk_${randomString}`;
}

// Crear un nuevo tenant
export async function createTenant(name: string, email: string) {
  const apiKey = generateApiKey();
  
  const tenant = await prisma.tenant.create({
    data: {
      name,
      apiKey,
      plan: 'starter', // Plan por defecto
    },
  });

  return {
    id: tenant.id,
    name: tenant.name,
    apiKey: tenant.apiKey,
    plan: tenant.plan,
    createdAt: tenant.createdAt,
  };
}

// Buscar tenant por API Key
export async function getTenantByApiKey(apiKey: string) {
  return await prisma.tenant.findUnique({
    where: { apiKey },
  });
}

// Listar todos los tenants (para admin)
export async function getAllTenants() {
  return await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      plan: true,
      createdAt: true,
      _count: {
        select: { users: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}