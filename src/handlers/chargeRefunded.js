import axios from "axios";
import { ownerNetByPaymentIntent } from "../store.js";

export async function handleChargeRefunded(event) {
  const charge = event.data.object;
  const connectedAccount = event.account;

  if (connectedAccount !== process.env.SUNNY_DAYS_STRIPE_ACCOUNT) return;
  if (!charge.payment_intent) return;

  const originalNet = ownerNetByPaymentIntent.get(charge.payment_intent);

  if (originalNet == null) {
    console.warn(
      "⚠️ Refund received but original net not found",
      charge.payment_intent
    );
    return;
  }

  const payload = {
    reservation_id: charge.metadata?.reservation_uid,
    unit_id: charge.metadata?.pool_id,
    charge_type: "pool_heat_refund", // or spa_heat_refund if applicable
    charge_amount: -originalNet,
    transaction_id: charge.payment_intent
  };

  await axios.post(process.env.SUNNY_DAYS_WEBHOOK_URL, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 5000
  });

  console.log("↩️ Sunny Days refund sent", payload);
}
