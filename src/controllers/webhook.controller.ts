import { FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import {
  sendSubscriptionConfirmation,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
} from '../services/email.service';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function handleStripeWebhook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sig = request.headers['stripe-signature'] as string;

  if (!sig) {
    return reply.status(400).send({ error: 'No signature' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body as any,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    request.log.error(`Webhook signature verification failed: ${err.message}`);
    return reply.status(400).send({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        request.log.info(`Unhandled event type: ${event.type}`);
    }

    return reply.status(200).send({ received: true });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Webhook handler failed' });
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: any) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'canceled' },
  });

  // ✅ PASO 4.6 - Enviar email de suscripción cancelada
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    if ('email' in customer && customer.email) {
      const endDate = new Date(subscription.current_period_end * 1000);
      await sendSubscriptionCanceledEmail(customer.email, endDate);
    }
  } catch (err) {
    console.error('Failed to send cancellation email:', err);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log(`✅ Payment succeeded for invoice: ${invoice.id}`);
  
  // ✅ PASO 4.6 - Enviar email de confirmación de pago
  if (invoice.customer_email) {
    sendSubscriptionConfirmation(invoice.customer_email, 'Pro')
      .catch((err: any) => console.error('Failed to send confirmation email:', err));
  }
}

async function handlePaymentFailed(invoice: any) {
  console.log(`❌ Payment failed for invoice: ${invoice.id}`);
  
  const subscriptionId = invoice.subscription;

  if (subscriptionId) {
    await prisma.subscription.updateMany({
      where: { 
        stripeSubscriptionId: typeof subscriptionId === 'string' 
          ? subscriptionId 
          : subscriptionId.id 
      },
      data: { status: 'past_due' },
    });
  }
  
  // ✅ PASO 4.6 - Enviar email de pago fallido
  if (invoice.customer_email) {
    sendPaymentFailedEmail(invoice.customer_email)
      .catch((err: any) => console.error('Failed to send payment failed email:', err));
  }
}