require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhooks');
const apiRoutes = require('./routes/api');
const billingRoutes = require('./routes/billing');
const trackRoutes = require('./routes/track');
const { startEmailScheduler } = require('./jobs/emailScheduler');

const app = express();
const prisma = new PrismaClient();

// Make prisma available globally
app.set('prisma', prisma);

// ── Raw body for Stripe & Shopify webhook HMAC verification ──────────────────
// IMPORTANT: must NOT call req.setEncoding() — Stripe SDK requires a raw Buffer.
app.use((req, res, next) => {
  if (
    req.originalUrl.startsWith('/webhooks') ||
    req.originalUrl.startsWith('/billing/webhook')
  ) {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => {
      req.rawBodyBuffer = Buffer.concat(chunks);       // Buffer for Stripe
      req.rawBody = req.rawBodyBuffer.toString('utf8'); // String for Shopify HMAC
      next();
    });
  } else {
    next();
  }
});

// ── Standard middleware ───────────────────────────────────────────────────────
// Skip JSON parsing for webhook routes — their body is already in req.rawBody/rawBodyBuffer
function skipForWebhooks(middleware) {
  return (req, res, next) => {
    if (req.originalUrl.startsWith('/webhooks') || req.originalUrl.startsWith('/billing/webhook')) {
      return next();
    }
    middleware(req, res, next);
  };
}
app.use(skipForWebhooks(express.json()));
app.use(skipForWebhooks(express.urlencoded({ extended: true })));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://admin.shopify.com',
  /\.myshopify\.com$/,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    cb(null, allowed);
  },
  credentials: true,
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/api', apiRoutes);
app.use('/billing', billingRoutes);
app.use('/track', trackRoutes);
app.use('/unsubscribe', require('./routes/unsubscribe').router);

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message, err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`ReviewPulse backend running on port ${PORT}`);
  await prisma.$connect();
  console.log('Database connected');
  startEmailScheduler(prisma);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
app.get('/', (req, res) => { const shop = req.query.shop; if (shop) { res.redirect('/auth/begin?shop=' + shop); } else { res.json({ status: 'ok' }); } });
