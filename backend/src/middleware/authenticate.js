const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Verifies the Shopify App Bridge session token (JWT) sent in the
 * Authorization header, then attaches req.shop to the request.
 *
 * Shopify signs these tokens with the app's API secret (HS256).
 * Payload.dest = "https://my-shop.myshopify.com"
 */
async function authenticate(req, res, next) {
  // ── Dev bypass: no App Bridge in local dev ────────────────────────────────
  if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-shop']) {
    const shopDomain = req.headers['x-dev-shop'];

    // Only auto-create the single canonical dev shop domain, never arbitrary ones
    const DEV_SHOP = 'dev-shop.myshopify.com';
    if (shopDomain !== DEV_SHOP) {
      return res.status(403).json({ error: `Dev bypass only allowed for ${DEV_SHOP}` });
    }

    let shop = await prisma.shop.findUnique({ where: { shopDomain } });
    if (!shop) {
      shop = await prisma.shop.create({
        data: {
          shopDomain,
          accessToken: 'dev_token',
          googleReviewUrl: '',
          emailFromName: 'Dev Shop Team',
          emailSubject: 'Wie war deine Bestellung? Hinterlasse uns eine Bewertung!',
          isActive: true,
        },
      });
      await prisma.subscription.create({
        data: {
          shopId: shop.id,
          stripeCustomerId: 'cus_dev_placeholder',
          status: 'trialing',
          currentPeriodEnd: new Date(Date.now() + 14 * 86400000),
        },
      });
    }
    req.shop = shop;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing session token' });
  }

  const token = authHeader.slice(7);

  let payload;
  try {
    payload = jwt.verify(token, process.env.SHOPIFY_API_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid session token', detail: err.message });
  }

  // dest = "https://shop.myshopify.com"
  const shopDomain = payload.dest?.replace(/^https?:\/\//, '');
  if (!shopDomain) {
    return res.status(401).json({ error: 'Token missing dest claim' });
  }

  const shop = await prisma.shop.findUnique({ where: { shopDomain } });
  if (!shop || !shop.isActive) {
    return res.status(403).json({ error: 'Shop not found or inactive' });
  }

  req.shop = shop;
  next();
}

module.exports = { authenticate };
