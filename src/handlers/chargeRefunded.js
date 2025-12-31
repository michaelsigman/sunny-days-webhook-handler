import axios from "axios";
import stripe from "../stripe.js";

export async function handleChargeRefunded(event) {
  const charge = event.data.object;
  const connectedAccount = event.account;

  // Only process Sunny Days connected account
  if (connectedAccount !== process.env.SUNNY_DAYS_STRIPE_ACCOUNT) return;
  if (!charge.payment_intent) return;

  // Retrieve the PaymentIntent to read PMS metadata
  const paymentIntent = await stripe.paymentIntents.retrieve(
    charge.payment_intent,
    { stripeAccount: connectedAccount }
  );

  const md = paymentIntent.metadata || {};

  const bookingNumber = md.booking_number;
  const pmsChargeAmount = Number(md.pms_charge_amount);

  if (!bookingNumber || isNaN(pmsChargeAmount)) {
    console.warn("⚠️ Missing required PMS metadata — skipping Sunny Days refund", {
      bookingNumber,
      pmsChargeAmount,
      metadata: md
    });
    return;
  }

  const payload = {
    booking_number: bookingNumber,
    reservation_id: "",
    unit_id: "",
    charge_type: `${md.charge_type || "pool_heat"}_refund`,
    charge_amount: Number((-pmsChargeAmount).toFixed(2)),
    transaction_id: paymentIntent.id
  };

  await axios.post(process.env.SUNNY_DAYS_WEBHOOK_URL, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 5000
  });

  console.log("↩️ Sunny Days refund sent", payload);
}
