import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getMetrics() {
  const totalTenants = await prisma.tenant.count();
  const totalUsers = await prisma.user.count();
  const totalSubscriptions = await prisma.subscription.count();
  const activeSubscriptions = await prisma.subscription.count({
    where: { status: 'active' },
  });

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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newUsersLast30Days = await prisma.user.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  const canceledSubscriptions = await prisma.subscription.count({
    where: { cancelAtPeriodEnd: true },
  });

  const churnRate = totalSubscriptions > 0
    ? (canceledSubscriptions / totalSubscriptions) * 100
    : 0;

  const userGrowth: Array<{ date: string; users: number }> = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = await prisma.user.count({
      where: {
        createdAt: { gte: date, lt: nextDate },
      },
    });

    userGrowth.push({
      date: date.toISOString().split('T')[0],
      users: count,
    });
  }

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

export async function getAllUsers() {
  return await prisma.user.findMany({
    include: {
      tenant: { select: { name: true, plan: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllSubscriptions() {
  return await prisma.subscription.findMany({
    include: {
      tenant: { select: { name: true } },
      user: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}