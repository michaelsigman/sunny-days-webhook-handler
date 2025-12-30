import axios from "axios";
import stripe from "../stripe.js";
import { ownerNetByPaymentIntent } from "../store.js";

export async function handlePaymentIntentSucceeded(event) {
  const pi = event.data.object;
  const connectedAccount = event.account;

  if (connectedAccount !== process.env.SUNNY_DAYS_STRIPE_ACCOUNT) return;
  if (!pi.metadata || !pi.metadata.reservation_uid) return;

  // 🔎 Retrieve charge with balance transaction
  const charge = await stripe.charges.retrieve(
    pi.latest_charge,
    { expand: ["balance_transaction"] },
    { stripeAccount: connectedAccount }
  );

  const netOwnerAmount = charge.balance_transaction.net / 100;

  const payload = {
    reservation_id: pi.metadata.reservation_uid,
    unit_id: pi.metadata.pool_id,
    charge_type:
      pi.metadata.block_type === "guest_heating" ? "pool_heat" : "spa_heat",
    charge_amount: netOwnerAmount,
    transaction_id: pi.id
  };

  // ✅ STORE the net owner amount for future refunds
  ownerNetByPaymentIntent.set(pi.id, netOwnerAmount);

  await axios.post(process.env.SUNNY_DAYS_WEBHOOK_URL, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 5000
  });

  console.log("✅ Sunny Days charge sent", payload);
}
