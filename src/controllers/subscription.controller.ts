import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createSubscription,
  getUserSubscriptions,
  cancelSubscription,
  createCustomerPortal,
} from '../services/stripe.service';

interface CreateSubscriptionBody {
  priceId: string;
}

interface CancelSubscriptionParams {
  subscriptionId: string;
}

interface PortalBody {
  returnUrl: string;
}

// POST /api/subscription/create
export async function create(
  request: FastifyRequest<{ Body: CreateSubscriptionBody }>,
  reply: FastifyReply
) {
  try {
    const { priceId } = request.body;
    const userId = request.user.userId;
    const tenantId = request.user.tenantId;

    if (!priceId) {
      return reply.status(400).send({
        error: 'Missing field',
        message: 'priceId is required',
      });
    }

    const result = await createSubscription(userId, tenantId, priceId);

    return reply.status(200).send(result);
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to create subscription',
    });
  }
}

// GET /api/subscription/list
export async function list(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user.userId;
    const tenantId = request.user.tenantId;

    const subscriptions = await getUserSubscriptions(userId, tenantId);

    return reply.status(200).send({
      total: subscriptions.length,
      subscriptions,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to get subscriptions',
    });
  }
}

// POST /api/subscription/:subscriptionId/cancel
export async function cancel(
  request: FastifyRequest<{ Params: CancelSubscriptionParams }>,
  reply: FastifyReply
) {
  try {
    const { subscriptionId } = request.params;
    const userId = request.user.userId;
    const tenantId = request.user.tenantId;

    const result = await cancelSubscription(subscriptionId, userId, tenantId);

    return reply.status(200).send(result);
  } catch (error: any) {
    if (error.message === 'Subscription not found') {
      return reply.status(404).send({
        error: 'Not found',
        message: error.message,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to cancel subscription',
    });
  }
}

// POST /api/subscription/portal
export async function portal(
  request: FastifyRequest<{ Body: PortalBody }>,
  reply: FastifyReply
) {
  try {
    const { returnUrl } = request.body;
    const tenantId = request.user.tenantId;

    if (!returnUrl) {
      return reply.status(400).send({
        error: 'Missing field',
        message: 'returnUrl is required',
      });
    }

    const portalUrl = await createCustomerPortal(tenantId, returnUrl);

    return reply.status(200).send({ url: portalUrl });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal error',
      message: 'Failed to create portal session',
    });
  }
}