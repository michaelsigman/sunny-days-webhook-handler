import axios from "axios";

export async function handlePaymentIntentSucceeded(event) {
  const pi = event.data.object;
  const connectedAccount = event.account;

  // Only process Sunny Days
  if (connectedAccount !== process.env.SUNNY_DAYS_STRIPE_ACCOUNT) {
    return;
  }

  if (!pi.metadata || !pi.metadata.reservation_uid) {
    console.warn("⚠️ Missing metadata for PI", pi.id);
    return;
  }

  const payload = {
    reservation_id: pi.metadata.reservation_uid,
    unit_id: pi.metadata.pool_id,
    charge_type:
      pi.metadata.block_type === "guest_heating"
        ? "pool_heat"
        : "spa_heat",
    charge_amount: pi.amount_received / 100,
    transaction_id: pi.id
  };

  try {
    await axios.post(process.env.SUNNY_DAYS_WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000
    });

    console.log("✅ Sunny Days webhook sent", payload);
  } catch (err) {
    console.error("❌ Failed to send Sunny Days webhook", {
      payment_intent: pi.id,
      error: err.message
    });
  }
}
