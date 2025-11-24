import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener métricas generales
export async function getMetrics() {
  // Total de tenants
  const totalTenants = await prisma.tenant.count();

  // Total de usuarios
  const totalUsers = await prisma.user.count();

  // Total de suscripciones (todas)
  const totalSubscriptions = await prisma.subscription.count();

  // Suscripciones activas
  const activeSubscriptions = await prisma.subscription.count({
    where: {
      status: 'active',
    },
  });

  // Calcular MRR (Monthly Recurring Revenue)
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'active' },
    select: { stripePriceId: true },
  });

  const priceMap: { [key: string]: number } = {
    [process.env.STRIPE_PRICE_STARTER || '']: 9.99,
    [process.env.STRIPE_PRICE_PRO || '']: 29.99,
  };

  const mrr = subscriptions.reduce((total, sub) => {
    return total + (priceMap[sub.stripePriceId] || 0);
  }, 0);

  // Nuevos usuarios en los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newUsersLast30Days = await prisma.user.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  // Calcular churn rate (simplificado)
  const canceledSubscriptions = await prisma.subscription.count({
    where: { cancelAtPeriodEnd: true },
  });

  const churnRate = totalSubscriptions > 0
    ? (canceledSubscriptions / totalSubscriptions) * 100
    : 0;

  // User growth (últimos 7 días para la gráfica)
  const userGrowth: Array<{ date: string; users: number }> = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = await prisma.user.count({
      where: {
        createdAt: {
          gte: date,
          lt: nextDate,
        },
      },
    });

    userGrowth.push({
      date: date.toISOString().split('T')[0],
      users: count,
    });
  }

  // RETURN COMPLETO CON TODOS LOS CAMPOS
  return {
    totalTenants,
    totalUsers,
    totalSubscriptions,
    activeSubscriptions,
    mrr: parseFloat(mrr.toFixed(2)),
    churnRate: parseFloat(churnRate.toFixed(2)),
    newUsersLast30Days,
    userGrowth,
  };
}

// Obtener todos los usuarios con sus tenants
export async function getAllUsers() {
  return await prisma.user.findMany({
    include: {
      tenant: {
        select: {
          name: true,
          plan: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Obtener todas las suscripciones
export async function getAllSubscriptions() {
  return await prisma.subscription.findMany({
    include: {
      tenant: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}