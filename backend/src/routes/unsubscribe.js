const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Generates a time-stable HMAC token for unsubscribe links.
 * Token = HMAC-SHA256(requestId, SHOPIFY_API_SECRET) as hex
 */
function generateUnsubscribeToken(requestId) {
  return crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
    .update(requestId)
    .digest('hex');
}

/**
 * GET /unsubscribe/:requestId?token=xxx
 *
 * Marks the review request as 'unsubscribed' and shows a confirmation page.
 * The HMAC token prevents arbitrary unsubscribes by third parties.
 */
router.get('/:requestId', async (req, res) => {
  const { requestId } = req.params;
  const { token } = req.query;

  if (!token) {
    return res.status(400).send(renderPage('Ungültiger Link', 'Der Abmelde-Link ist unvollständig.', false));
  }

  // Verify token
  const expected = generateUnsubscribeToken(requestId);
  const tokenBuf = Buffer.from(token, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  const valid =
    tokenBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(tokenBuf, expectedBuf);

  if (!valid) {
    return res.status(403).send(renderPage('Ungültiger Link', 'Dieser Abmelde-Link ist ungültig oder abgelaufen.', false));
  }

  try {
    const request = await prisma.reviewRequest.findUnique({
      where: { id: requestId },
      include: { shop: { select: { emailFromName: true, shopDomain: true } } },
    });

    if (!request) {
      return res.status(404).send(renderPage('Nicht gefunden', 'Dieser Abmelde-Link ist nicht mehr gültig.', false));
    }

    // Idempotent — only update if not already unsubscribed
    if (request.status !== 'unsubscribed') {
      await prisma.reviewRequest.update({
        where: { id: requestId },
        data: { status: 'unsubscribed' },
      });
    }

    const shopName = request.shop?.emailFromName || request.shop?.shopDomain || 'dem Shop';
    return res.send(renderPage(
      'Erfolgreich abgemeldet',
      `Du wirst keine weiteren Bewertungs-Emails von <strong>${escapeHtml(shopName)}</strong> erhalten.`,
      true,
    ));
  } catch (err) {
    console.error('[Unsubscribe] Error:', err.message);
    return res.status(500).send(renderPage('Fehler', 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.', false));
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderPage(title, message, success) {
  const icon = success ? '✅' : '❌';
  const color = success ? '#1a5c38' : '#dc2626';
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)} — ReviewPulse</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #f9fafb; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; padding: 24px; box-sizing: border-box; }
    .card { background: white; border-radius: 16px; padding: 40px 32px; max-width: 440px;
            width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 12px; }
    p { font-size: 15px; color: #6b7280; line-height: 1.6; margin: 0; }
    .badge { display: inline-block; background: ${color}18; color: ${color};
             padding: 6px 16px; border-radius: 99px; font-size: 13px; font-weight: 600;
             margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${message}</p>
    <div class="badge">${success ? 'Abmeldung bestätigt' : 'Aktion fehlgeschlagen'}</div>
  </div>
</body>
</html>`;
}

module.exports = { router, generateUnsubscribeToken };
