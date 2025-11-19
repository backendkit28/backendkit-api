import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener métricas generales
export async function getMetrics() {
  // Total de tenants
  const totalTenants = await prisma.tenant.count();

  // Total de usuarios
  const totalUsers = await prisma.user.count();

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
  const totalSubscriptionsEver = await prisma.subscription.count();
  const canceledSubscriptions = await prisma.subscription.count({
    where: { cancelAtPeriodEnd: true },
  });

  const churnRate = totalSubscriptionsEver > 0
    ? (canceledSubscriptions / totalSubscriptionsEver) * 100
    : 0;

  // Revenue by plan
  const starterRevenue = subscriptions.filter(
    (s) => s.stripePriceId === process.env.STRIPE_PRICE_STARTER
  ).length * 9.99;

  const proRevenue = subscriptions.filter(
    (s) => s.stripePriceId === process.env.STRIPE_PRICE_PRO
  ).length * 29.99;

  // User growth (últimos 30 días)
  const userGrowth: Array<{ date: string; count: number }> = [];

  return {
    totalTenants,
    totalUsers,
    activeSubscriptions,
    mrr,
    newUsersLast30Days,
    churnRate,
    revenueByPlan: {
      starter: starterRevenue,
      pro: proRevenue,
    },
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