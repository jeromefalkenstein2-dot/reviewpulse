const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES,
  HOST,
  FRONTEND_URL,
} = process.env;

// In-memory nonce store (use Redis in production for multi-instance)
const pendingNonces = new Map();

// ── Step 1: Begin OAuth ───────────────────────────────────────────────────────
router.get('/begin', (req, res) => {
  const shop = sanitizeShopDomain(req.query.shop);
  if (!shop) return res.status(400).send('Missing or invalid shop parameter');

  const nonce = crypto.randomBytes(16).toString('hex');
  pendingNonces.set(nonce, { shop, createdAt: Date.now() });

  // Clean up old nonces (older than 10 min)
  cleanNonces();

  const redirectUri = `${HOST}/auth/callback`;
  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SHOPIFY_SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${nonce}`;

  res.redirect(installUrl);
});

// ── Step 2: OAuth Callback ────────────────────────────────────────────────────
router.get('/callback', async (req, res) => {
  const { shop, code, state, hmac } = req.query;

  // 1. Validate shop
  const cleanShop = sanitizeShopDomain(shop);
  if (!cleanShop) return res.status(400).send('Invalid shop');

  // 2. Verify nonce
  const pending = pendingNonces.get(state);
  if (!pending || pending.shop !== cleanShop) {
    return res.status(403).send('Invalid state / nonce mismatch');
  }
  pendingNonces.delete(state);

  // 3. Verify HMAC
  if (!verifyHmac(req.query, SHOPIFY_API_SECRET)) {
    return res.status(403).send('HMAC verification failed');
  }

  try {
    // 4. Exchange code for access token
    const tokenRes = await axios.post(
      `https://${cleanShop}/admin/oauth/access_token`,
      {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }
    );
    const accessToken = tokenRes.data.access_token;

    // 5. Upsert shop in DB
    const dbShop = await prisma.shop.upsert({
      where: { shopDomain: cleanShop },
      update: { accessToken, isActive: true },
      create: { shopDomain: cleanShop, accessToken },
    });

    // 6. Register webhooks
    await registerWebhooks(cleanShop, accessToken);

    // 7. Create Stripe trial subscription (via billing service)
    const { ensureSubscription } = require('../services/stripe');
    await ensureSubscription(dbShop);

    // 8. Redirect to embedded app
    const host = Buffer.from(`${cleanShop}/admin`).toString('base64');
    res.redirect(`${FRONTEND_URL}?shop=${cleanShop}&host=${host}`);
  } catch (err) {
    console.error('[Auth callback error]', err.message);
    res.status(500).send('Installation failed. Please try again.');
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitizeShopDomain(shop) {
  if (!shop) return null;
  const clean = shop.trim().toLowerCase().replace(/^https?:\/\//, '');
  if (!/^[a-z0-9-]+\.myshopify\.com$/.test(clean)) return null;
  return clean;
}

function verifyHmac(params, secret) {
  const { hmac, ...rest } = params;
  const message = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('&');
  const computed = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac));
}

async function registerWebhooks(shop, accessToken) {
  const webhooks = [
    { topic: 'orders/fulfilled', address: `${HOST}/webhooks/orders-fulfilled` },
    { topic: 'app/uninstalled', address: `${HOST}/webhooks/app-uninstalled` },
  ];

  for (const wh of webhooks) {
    try {
      await axios.post(
        `https://${shop}/admin/api/2024-04/webhooks.json`,
        { webhook: { topic: wh.topic, address: wh.address, format: 'json' } },
        { headers: { 'X-Shopify-Access-Token': accessToken } }
      );
      console.log(`[Webhook] Registered ${wh.topic} for ${shop}`);
    } catch (err) {
      // 422 = already exists, safe to ignore
      if (err.response?.status !== 422) {
        console.error(`[Webhook] Failed to register ${wh.topic}:`, err.message);
      }
    }
  }
}

function cleanNonces() {
  const tenMinutes = 10 * 60 * 1000;
  const now = Date.now();
  for (const [key, val] of pendingNonces.entries()) {
    if (now - val.createdAt > tenMinutes) pendingNonces.delete(key);
  }
}

module.exports = router;
