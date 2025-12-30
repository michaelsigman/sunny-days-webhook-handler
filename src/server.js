import express from "express";
import stripe from "./stripe.js";
import { handlePaymentIntentSucceeded } from "./handlers/paymentIntentSucceeded.js";

const app = express();

// IMPORTANT: raw body for Stripe
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
      console.error("❌ Stripe signature verification failed", err.message);
      return res.status(400).send("Webhook Error");
    }

    if (event.type === "payment_intent.succeeded") {
      await handlePaymentIntentSucceeded(event);
    }

    res.json({ received: true });
  }
);

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sunny Days webhook handler running on ${PORT}`);
});
