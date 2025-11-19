import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Crear Customer en Stripe
export async function createStripeCustomer(email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name,
  });

  return customer.id;
}

// Crear suscripción
export async function createSubscription(
  userId: string,
  tenantId: string,
  priceId: string
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    include: { tenant: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  let customerId = user.tenant.stripeCustomerId;

  if (!customerId) {
    customerId = await createStripeCustomer(user.email, user.tenant.name);
    
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customerId },
    });
  }

  // ✅ Crear Setup Intent para capturar método de pago
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });

  // Crear suscripción en Stripe
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { 
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
  });

  // Usar campos que SÍ existen en suscripciones incomplete
  const subscriptionData = subscription as any;
  
  const periodStart = subscriptionData.start_date || subscriptionData.created;
  
  // Calcular period end basado en el plan
  const plan = subscriptionData.plan;
  let periodEnd = periodStart;
  
  if (plan && plan.interval === 'month') {
    const startDate = new Date(periodStart * 1000);
    startDate.setMonth(startDate.getMonth() + (plan.interval_count || 1));
    periodEnd = Math.floor(startDate.getTime() / 1000);
  } else if (plan && plan.interval === 'year') {
    const startDate = new Date(periodStart * 1000);
    startDate.setFullYear(startDate.getFullYear() + (plan.interval_count || 1));
    periodEnd = Math.floor(startDate.getTime() / 1000);
  }

  // Verificar si ya existe
  const existingSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSubscription) {
    await prisma.subscription.create({
      data: {
        tenantId,
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        status: subscription.status,
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
      },
    });
  }

  // ✅ Obtener clientSecret del Setup Intent
  let clientSecret: string | null = setupIntent.client_secret;
  
  // Si por alguna razón no hay setup intent, buscar payment intent
  if (!clientSecret && subscription.latest_invoice) {
    const invoice = subscription.latest_invoice as any;
    if (invoice.payment_intent) {
      if (typeof invoice.payment_intent === 'string') {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          invoice.payment_intent
        );
        clientSecret = paymentIntent.client_secret;
      } else {
        clientSecret = invoice.payment_intent.client_secret || null;
      }
    }
  }

  console.log('✅ Final clientSecret status:', !!clientSecret);

  return {
    subscriptionId: subscription.id,
    clientSecret: clientSecret,
  };
}

// Obtener suscripciones de un usuario
export async function getUserSubscriptions(userId: string, tenantId: string) {
  return await prisma.subscription.findMany({
    where: { userId, tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

// Cancelar suscripción
export async function cancelSubscription(
  subscriptionId: string,
  userId: string,
  tenantId: string
) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
      userId,
      tenantId,
    },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const stripeSubscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true },
  });

  const subscriptionData = stripeSubscription as any;
  const periodEnd = subscriptionData.current_period_end || subscriptionData.billing_cycle_anchor;

  return {
    message: 'Subscription will be canceled at period end',
    cancelAt: new Date(periodEnd * 1000),
  };
}

// Portal de cliente
export async function createCustomerPortal(tenantId: string, returnUrl: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant?.stripeCustomerId) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}