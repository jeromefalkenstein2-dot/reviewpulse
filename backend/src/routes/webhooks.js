const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// ── HMAC verification middleware ──────────────────────────────────────────────
function verifyShopifyWebhook(req, res, next) {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  if (!hmac || !req.rawBody) {
    return res.status(401).json({ error: 'Missing HMAC or body' });
  }

  const computed = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(req.rawBody, 'utf8')
    .digest('base64');

  // timingSafeEqual requires equal-length buffers — check first to avoid throw
  const bufComputed = Buffer.from(computed);
  const bufHmac = Buffer.from(hmac);
  if (bufComputed.length !== bufHmac.length ||
      !crypto.timingSafeEqual(bufComputed, bufHmac)) {
    return res.status(401).json({ error: 'HMAC verification failed' });
  }
  next();
}

// ── orders/fulfilled ──────────────────────────────────────────────────────────
router.post('/orders-fulfilled', verifyShopifyWebhook, async (req, res) => {
  // Acknowledge immediately
  res.status(200).json({ received: true });

  const shopDomain = req.headers['x-shopify-shop-domain'];
  let order;
  try {
    order = JSON.parse(req.rawBody);
  } catch {
    return;
  }

  try {
    const shop = await prisma.shop.findUnique({ where: { shopDomain } });
    if (!shop || !shop.isActive) return;

    const email = order.email || order.customer?.email;
    const firstName = order.customer?.first_name || '';
    const lastName = order.customer?.last_name || '';
    const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Customer';

    if (!email) {
      console.log(`[Webhook] No email for order ${order.id}, skipping`);
      return;
    }

    // Schedule review request: send after emailDelay hours
    const pendingAt = new Date(Date.now() + shop.emailDelay * 60 * 60 * 1000);

    await prisma.reviewRequest.upsert({
      where: { shopId_orderId: { shopId: shop.id, orderId: String(order.id) } },
      update: {},  // don't re-schedule if already exists
      create: {
        shopId: shop.id,
        orderId: String(order.id),
        orderName: order.name || `#${order.order_number}`,
        customerEmail: email,
        customerName,
        pendingAt,
        status: 'pending',
      },
    });

    console.log(`[Webhook] Review request scheduled for order ${order.name} (${email}), send at ${pendingAt.toISOString()}`);
  } catch (err) {
    console.error('[Webhook] orders/fulfilled error:', err.message);
  }
});

// ── app/uninstalled ───────────────────────────────────────────────────────────
router.post('/app-uninstalled', verifyShopifyWebhook, async (req, res) => {
  res.status(200).json({ received: true });

  const shopDomain = req.headers['x-shopify-shop-domain'];
  try {
    await prisma.shop.update({
      where: { shopDomain },
      data: { isActive: false, accessToken: '' },
    });
    console.log(`[Webhook] Shop uninstalled: ${shopDomain}`);
  } catch (err) {
    console.error('[Webhook] app/uninstalled error:', err.message);
  }
});

module.exports = router;
