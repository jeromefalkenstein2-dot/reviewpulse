const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// ── GET /api/shop ─────────────────────────────────────────────────────────────
router.get('/shop', async (req, res) => {
  const shop = await prisma.shop.findUnique({
    where: { id: req.shop.id },
    include: { subscription: true },
  });
  res.json({
    shopDomain: shop.shopDomain,
    googleReviewUrl: shop.googleReviewUrl,
    emailDelay: shop.emailDelay,
    emailSubject: shop.emailSubject,
    emailFromName: shop.emailFromName,
    subscription: shop.subscription
      ? {
          status: shop.subscription.status,
          currentPeriodEnd: shop.subscription.currentPeriodEnd,
        }
      : null,
  });
});

// ── PUT /api/shop ─────────────────────────────────────────────────────────────
router.put('/shop', async (req, res) => {
  const { googleReviewUrl, emailDelay, emailSubject, emailFromName } = req.body;

  const data = {};

  if (googleReviewUrl !== undefined) {
    if (typeof googleReviewUrl !== 'string' || !isValidUrl(googleReviewUrl)) {
      return res.status(400).json({ error: 'Invalid Google Review URL' });
    }
    data.googleReviewUrl = googleReviewUrl;
  }

  if (emailDelay !== undefined) {
    const delay = parseInt(emailDelay, 10);
    if (isNaN(delay) || delay < 0 || delay > 168) {
      return res.status(400).json({ error: 'emailDelay must be 0-168 hours' });
    }
    data.emailDelay = delay;
  }

  if (emailSubject !== undefined) {
    // Reject null, non-strings, or whitespace-only values
    if (typeof emailSubject !== 'string' || !emailSubject.trim()) {
      return res.status(400).json({ error: 'emailSubject must be a non-empty string' });
    }
    data.emailSubject = emailSubject.trim().slice(0, 200);
  }

  if (emailFromName !== undefined) {
    if (typeof emailFromName !== 'string' || !emailFromName.trim()) {
      return res.status(400).json({ error: 'emailFromName must be a non-empty string' });
    }
    data.emailFromName = emailFromName.trim().slice(0, 100);
  }

  const shop = await prisma.shop.update({
    where: { id: req.shop.id },
    data,
  });

  res.json({ ok: true, shop });
});

// Allowed status values — whitelist prevents invalid filter values crashing Prisma
const VALID_STATUSES = new Set(['pending', 'sent', 'clicked', 'bounced', 'unsubscribed']);

// ── GET /api/review-requests ──────────────────────────────────────────────────
router.get('/review-requests', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

  // Whitelist status to prevent injection / unknown Prisma enum errors
  const rawStatus = req.query.status;
  const status = rawStatus && VALID_STATUSES.has(rawStatus) ? rawStatus : undefined;

  const skip = (page - 1) * limit;

  const where = {
    shopId: req.shop.id,
    ...(status ? { status } : {}),
  };

  const [requests, total] = await prisma.$transaction([
    prisma.reviewRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.reviewRequest.count({ where }),
  ]);

  res.json({
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ── GET /api/analytics ────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  const shopId = req.shop.id;

  const [total, sent, clicked, pending, last30Days] = await prisma.$transaction([
    prisma.reviewRequest.count({ where: { shopId } }),
    prisma.reviewRequest.count({ where: { shopId, status: 'sent' } }),
    prisma.reviewRequest.count({ where: { shopId, status: 'clicked' } }),
    prisma.reviewRequest.count({ where: { shopId, status: 'pending' } }),
    prisma.reviewRequest.findMany({
      where: {
        shopId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Build daily counts for chart
  const dailyMap = {};
  for (const req of last30Days) {
    const day = req.createdAt.toISOString().slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { sent: 0, clicked: 0 };
    if (req.status === 'sent') dailyMap[day].sent++;
    if (req.status === 'clicked') dailyMap[day].clicked++;
  }

  const clickRate = sent + clicked > 0
    ? Math.round((clicked / (sent + clicked)) * 100)
    : 0;

  res.json({
    stats: { total, sent, clicked, pending, clickRate },
    daily: dailyMap,
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

module.exports = router;
