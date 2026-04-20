const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/authenticate');
const stripeService = require('../services/stripe');

const router = express.Router();
const prisma = new PrismaClient();

// ── POST /billing/create-checkout ─────────────────────────────────────────────
// Creates a Stripe Checkout session for new subscriptions
router.post('/create-checkout', authenticate, async (req, res) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { shopId: req.shop.id },
    });

    if (sub?.status === 'active') {
      return res.status(400).json({ error: 'Already subscribed' });
    }

    const session = await stripeService.createCheckoutSession(req.shop, sub);
    res.json({ url: session.url });
  } catch (err) {
    console.error('[Billing] create-checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ── POST /billing/portal ──────────────────────────────────────────────────────
// Returns a Stripe Customer Portal URL for subscription management
router.post('/portal', authenticate, async (req, res) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { shopId: req.shop.id },
    });

    if (!sub?.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const session = await stripeService.createPortalSession(
      sub.stripeCustomerId,
      `${process.env.FRONTEND_URL}?shop=${req.shop.shopDomain}`
    );
    res.json({ url: session.url });
  } catch (err) {
    console.error('[Billing] portal error:', err.message);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// ── POST /billing/webhook ─────────────────────────────────────────────────────
// Stripe webhook – raw body required (set up in index.js)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // Must pass the raw Buffer (not a string) — setEncoding() must NOT have been called
    event = stripeService.stripe.webhooks.constructEvent(
      req.rawBodyBuffer ?? req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err.message);
    res.status(500).json({ error: 'Handler failed' });
  }
});

// ── Stripe event handler ──────────────────────────────────────────────────────
async function handleStripeEvent(event) {
  const data = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      // Payment complete → activate subscription
      const shopId = data.metadata?.shopId;
      if (!shopId) break;
      await prisma.subscription.upsert({
        where: { shopId },
        update: {
          stripeCustomerId: data.customer,
          stripeSubscriptionId: data.subscription,
          status: 'active',
        },
        create: {
          shopId,
          stripeCustomerId: data.customer,
          stripeSubscriptionId: data.subscription,
          status: 'active',
        },
      });
      console.log(`[Stripe] Subscription activated for shop ${shopId}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: data.id },
      });
      if (!sub) break;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: data.status,
          currentPeriodEnd: new Date(data.current_period_end * 1000),
        },
      });
      console.log(`[Stripe] Subscription updated: ${data.status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: data.id },
      });
      if (!sub) break;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'canceled', stripeSubscriptionId: null },
      });
      console.log(`[Stripe] Subscription canceled`);
      break;
    }

    case 'invoice.payment_failed': {
      const sub = await prisma.subscription.findFirst({
        where: { stripeCustomerId: data.customer },
      });
      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'past_due' },
        });
      }
      break;
    }

    default:
      console.log(`[Stripe] Unhandled event type: ${event.type}`);
  }
}

module.exports = router;
