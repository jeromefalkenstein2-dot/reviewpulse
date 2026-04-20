const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

/**
 * Creates a Stripe Checkout Session for a new subscription.
 */
async function createCheckoutSession(shop, existingSub) {
  const trialDays = parseInt(process.env.STRIPE_TRIAL_DAYS || '14', 10);

  // Reuse existing customer if available
  let customerId = existingSub?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: `admin@${shop.shopDomain}`,
      metadata: { shopDomain: shop.shopDomain, shopId: shop.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    subscription_data: {
      trial_period_days: trialDays,
      metadata: { shopId: shop.id },
    },
    success_url: `${process.env.FRONTEND_URL}?shop=${shop.shopDomain}&billing=success`,
    cancel_url: `${process.env.FRONTEND_URL}?shop=${shop.shopDomain}&billing=cancel`,
    metadata: { shopId: shop.id },
  });

  return session;
}

/**
 * Creates a Stripe Customer Portal session for subscription management.
 */
async function createPortalSession(stripeCustomerId, returnUrl) {
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
}

/**
 * Called after OAuth install — creates a trialing subscription record in the DB
 * so the shop can use the app immediately during the trial.
 */
async function ensureSubscription(shop) {
  const existing = await prisma.subscription.findUnique({
    where: { shopId: shop.id },
  });
  if (existing) return existing;

  const trialDays = parseInt(process.env.STRIPE_TRIAL_DAYS || '14', 10);
  const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

  // Create a Stripe customer placeholder
  const customer = await stripe.customers.create({
    email: `admin@${shop.shopDomain}`,
    metadata: { shopDomain: shop.shopDomain, shopId: shop.id },
  });

  return prisma.subscription.create({
    data: {
      shopId: shop.id,
      stripeCustomerId: customer.id,
      status: 'trialing',
      currentPeriodEnd: trialEnd,
    },
  });
}

module.exports = { stripe, createCheckoutSession, createPortalSession, ensureSubscription };
