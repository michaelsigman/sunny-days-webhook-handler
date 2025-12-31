import axios from "axios";

export async function handlePaymentIntentSucceeded(event) {
  const pi = event.data.object;
  const connectedAccount = event.account;

  // Only process Sunny Days connected account
  if (connectedAccount !== process.env.SUNNY_DAYS_STRIPE_ACCOUNT) return;

  const md = pi.metadata || {};

  const bookingNumber = md.booking_number;
  const pmsChargeAmount = Number(md.pms_charge_amount);

  if (!bookingNumber || isNaN(pmsChargeAmount)) {
    console.warn("⚠️ Missing required PMS metadata — skipping Sunny Days charge", {
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
    charge_type: md.charge_type || "pool_heat",
    charge_amount: Number(pmsChargeAmount.toFixed(2)),
    transaction_id: pi.id
  };

  await axios.post(process.env.SUNNY_DAYS_WEBHOOK_URL, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 5000
  });

  console.log("✅ Sunny Days charge sent", payload);
}
