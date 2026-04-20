const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /track/click/:requestId
 *
 * Records a click on the review link and redirects the customer
 * to the shop's Google Review page.
 */
router.get('/click/:requestId', async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await prisma.reviewRequest.findUnique({
      where: { id: requestId },
      include: { shop: { select: { googleReviewUrl: true } } },
    });

    if (!request) {
      return res.status(404).send('Review link not found');
    }

    // Update status to clicked (only if not already clicked)
    if (request.status === 'sent') {
      await prisma.reviewRequest.update({
        where: { id: requestId },
        data: { status: 'clicked' },
      });
    }

    const redirectUrl = request.shop.googleReviewUrl;
    if (!redirectUrl) {
      return res.status(400).send('No Google Review URL configured for this shop');
    }

    res.redirect(302, redirectUrl);
  } catch (err) {
    console.error('[Track] Click error:', err.message);
    res.status(500).send('Something went wrong');
  }
});

module.exports = router;
