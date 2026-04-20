const cron = require('node-cron');
const { sendReviewRequestEmail } = require('../services/email');

/**
 * Runs every 2 minutes.
 * Finds all ReviewRequests with status='pending' whose pendingAt <= now,
 * sends the email, and updates the status.
 *
 * Only sends for shops that:
 *   - are active (isActive = true)
 *   - have a googleReviewUrl configured
 *   - have an active or trialing subscription
 */
function startEmailScheduler(prisma) {
  console.log('[Scheduler] Email scheduler started (every 2 minutes)');

  cron.schedule('*/2 * * * *', async () => {
    try {
      await processPendingRequests(prisma);
    } catch (err) {
      console.error('[Scheduler] Unexpected error:', err.message);
    }
  });
}

async function processPendingRequests(prisma) {
  const now = new Date();

  const pending = await prisma.reviewRequest.findMany({
    where: {
      status: 'pending',
      pendingAt: { lte: now },
      shop: {
        isActive: true,
        googleReviewUrl: { not: '' },
        subscription: {
          status: { in: ['active', 'trialing'] },
        },
      },
    },
    include: {
      shop: true,
    },
    take: 50, // process max 50 per run to avoid overload
  });

  if (pending.length === 0) return;

  console.log(`[Scheduler] Processing ${pending.length} pending review request(s)`);

  for (const request of pending) {
    try {
      await sendReviewRequestEmail(request.shop, request);

      await prisma.reviewRequest.update({
        where: { id: request.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      console.log(`[Scheduler] Sent review email to ${request.customerEmail} (order ${request.orderName})`);
    } catch (err) {
      console.error(`[Scheduler] Failed to send email for request ${request.id}:`, err.message);

      // Mark as bounced if Resend returns a hard failure
      if (err.message?.includes('Resend error')) {
        await prisma.reviewRequest.update({
          where: { id: request.id },
          data: { status: 'bounced' },
        });
      }
      // Otherwise leave as pending so it can be retried next run
    }
  }
}

module.exports = { startEmailScheduler };
