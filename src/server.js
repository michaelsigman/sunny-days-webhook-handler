import express from "express";
import stripe from "./stripe.js";
import { handlePaymentIntentSucceeded } from "./handlers/paymentIntentSucceeded.js";
import { handleChargeRefunded } from "./handlers/chargeRefunded.js";

const app = express();

/**
 * Stripe webhook endpoint
 * IMPORTANT: must use express.raw()
 */
app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Stripe signature verification failed:", err.message);
      return res.status(400).send("Webhook Error");
    }

    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(event);
          break;

        case "charge.refunded":
          await handleChargeRefunded(event);
          break;

        // We intentionally ignore checkout.session.completed
        // It is subscribed only to ensure Stripe routes events correctly
        default:
          break;
      }
    } catch (err) {
      // Never throw — Stripe must always receive 200
      console.error("❌ Error processing Stripe event:", {
        type: event.type,
        error: err.message
      });
    }

    res.json({ received: true });
  }
);

/**
 * Health check for Render
 */
app.get("/health", (_, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Sunny Days webhook handler running on port ${PORT}`);
});
