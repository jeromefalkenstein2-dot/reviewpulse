const { Resend } = require('resend');
const { generateUnsubscribeToken } = require('../routes/unsubscribe');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends the review request email to a customer.
 */
async function sendReviewRequestEmail(shop, request) {
  const trackingUrl = `${process.env.HOST}/track/click/${request.id}`;
  const firstName = request.customerName.split(' ')[0] || 'Kunde';

  // DSGVO: generate a signed unsubscribe token
  const unsubToken = generateUnsubscribeToken(request.id);
  const unsubscribeUrl = `${process.env.HOST}/unsubscribe/${request.id}?token=${unsubToken}`;

  const html = buildEmailHtml({
    shopName: shop.emailFromName || shop.shopDomain,
    customerName: firstName,
    orderName: request.orderName,
    trackingUrl,
    unsubscribeUrl,
  });

  const result = await resend.emails.send({
    from: `${shop.emailFromName} <${process.env.RESEND_FROM_EMAIL}>`,
    to: request.customerEmail,
    subject: shop.emailSubject,
    html,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  return result;
}

function buildEmailHtml({ shopName, customerName, orderName, trackingUrl, unsubscribeUrl }) {
  const shop = escapeHtml(shopName);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hinterlasse uns eine Bewertung</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #f3f4f6;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 560px;
      margin: 32px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1a5c38 0%, #2d8653 60%, #3aa867 100%);
      padding: 40px 32px 36px;
      text-align: center;
      position: relative;
    }
    .header-circle-1 {
      position: absolute;
      top: -32px; right: -32px;
      width: 140px; height: 140px;
      background: rgba(255,255,255,0.07);
      border-radius: 50%;
    }
    .header-circle-2 {
      position: absolute;
      bottom: -50px; left: 20px;
      width: 110px; height: 110px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }

    /* Stars */
    .stars-row {
      display: inline-flex;
      gap: 6px;
      margin-bottom: 18px;
      position: relative;
      z-index: 1;
    }
    .star {
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.15);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }

    .header-title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.4px;
      line-height: 1.3;
      position: relative;
      z-index: 1;
    }
    .header-sub {
      font-size: 14px;
      color: rgba(255,255,255,0.72);
      margin-top: 6px;
      position: relative;
      z-index: 1;
    }
    .header-order {
      display: inline-block;
      background: rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.9);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 14px;
      position: relative;
      z-index: 1;
    }

    /* ── Body ── */
    .body {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 16px;
      color: #111827;
      margin-bottom: 12px;
      font-weight: 400;
    }
    .greeting strong { font-weight: 700; }
    .message {
      font-size: 15px;
      color: #374151;
      line-height: 1.7;
      margin-bottom: 28px;
    }
    .message strong { color: #111827; }

    /* ── Value props ── */
    .values {
      background: #f0faf4;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 28px;
    }
    .value-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13.5px;
      color: #374151;
      padding: 5px 0;
    }
    .value-dot {
      width: 6px; height: 6px;
      background: #1a5c38;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ── CTA ── */
    .cta-wrapper { text-align: center; margin-bottom: 28px; }
    .cta-btn {
      display: inline-block;
      background: #1a5c38;
      color: #ffffff !important;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: -0.2px;
      box-shadow: 0 4px 14px rgba(26,92,56,0.35);
    }
    .cta-note {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 12px;
      text-align: center;
    }

    /* ── Divider ── */
    .divider {
      height: 1px;
      background: #f3f4f6;
      margin: 24px 0;
    }

    /* ── Footer ── */
    .footer {
      background: #f9fafb;
      padding: 20px 32px;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.7;
    }
    .footer-text a { color: #6b7280; text-decoration: none; }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .wrapper { margin: 0; border-radius: 0; }
      .body { padding: 28px 20px; }
      .header { padding: 32px 20px 28px; }
      .footer { padding: 16px 20px; }
      .cta-btn { padding: 14px 28px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header -->
    <div class="header">
      <div class="header-circle-1"></div>
      <div class="header-circle-2"></div>

      <div class="stars-row">
        <span class="star">⭐</span>
        <span class="star">⭐</span>
        <span class="star">⭐</span>
        <span class="star">⭐</span>
        <span class="star">⭐</span>
      </div>

      <div class="header-title">Vielen Dank für deinen Einkauf!</div>
      <div class="header-sub">Wir hoffen, du liebst dein neues Produkt</div>

      ${orderName ? `<div class="header-order">📦 ${escapeHtml(orderName)}</div>` : ''}
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">Hallo <strong>${escapeHtml(customerName)}</strong>,</p>
      <p class="message">
        wir hoffen, dass du mit deiner Bestellung bei <strong>${shop}</strong> rundum
        zufrieden bist. Deine Meinung ist uns und zukünftigen Kunden wirklich wichtig!
      </p>

      <!-- Value props -->
      <div class="values">
        <div class="value-item">
          <span class="value-dot"></span>
          Hilft anderen Kunden bei ihrer Kaufentscheidung
        </div>
        <div class="value-item">
          <span class="value-dot"></span>
          Dauert nur 60 Sekunden
        </div>
        <div class="value-item">
          <span class="value-dot"></span>
          Unterstützt unser kleines Unternehmen direkt
        </div>
      </div>

      <!-- CTA -->
      <div class="cta-wrapper">
        <a href="${trackingUrl}" class="cta-btn">
          ⭐ Jetzt Google-Bewertung schreiben
        </a>
        <p class="cta-note">Öffnet direkt die Google-Bewertungsseite</p>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
        Herzlichen Dank für dein Vertrauen und deine Unterstützung.<br/>
        <strong style="color: #111827;">— Das Team von ${shop}</strong>
      </p>
    </div>

    <!-- Footer (DSGVO-konform) -->
    <div class="footer">
      <p class="footer-text">
        Du erhältst diese Email, weil du kürzlich bei <strong>${shop}</strong> eingekauft hast.<br/>
        Bei Fragen zu deiner Bestellung antworte einfach auf diese Email.
      </p>
      <p class="footer-text" style="margin-top:10px; border-top: 1px solid #e5e7eb; padding-top: 10px;">
        Du möchtest keine Bewertungs-Anfragen mehr erhalten?
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">
          Jetzt abmelden
        </a>
        &nbsp;·&nbsp;
        Deine Daten werden gemäß unserer Datenschutzerklärung verarbeitet.
      </p>
    </div>

  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sendReviewRequestEmail };
