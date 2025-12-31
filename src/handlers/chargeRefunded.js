import axios from "axios";
import stripe from "../stripe.js";

export async function handleChargeRefunded(event) {
  const charge = event.data.object;
  const connectedAccount = event.account;

  if (connectedAccount !== process.env.SUNNY_DAYS_STRIPE_ACCOUNT) return;
  if (!charge.payment_intent) return;

  const pi = await stripe.paymentIntents.retrieve(
    charge.payment_intent,
    { stripeAccount: connectedAccount }
  );

  const md = pi.metadata || {};

  if (!md.reservation_uid || !md.base_amount_cents) {
    console.warn("⚠️ Missing required metadata — skipping Sunny Days refund", {
      metadata: md
    });
    return;
  }

  const bookingNumber =
    "BKG-" + md.reservation_uid.replace(/^RES-/, "");

  const chargeAmount = Number(md.base_amount_cents) / 100;

  const payload = {
    booking_number: bookingNumber,
    reservation_id: "",
    unit_id: "",
    charge_type:
      `${md.block_type === "guest_heating" ? "pool_heat" : "spa_heat"}_refund`,
    charge_amount: Number((-chargeAmount).toFixed(2)),
    transaction_id: pi.id
  };

  await axios.post(process.env.SUNNY_DAYS_WEBHOOK_URL, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 5000
  });

  console.log("↩️ Sunny Days refund sent", payload);
}
