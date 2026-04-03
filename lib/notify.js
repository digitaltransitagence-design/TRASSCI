/**
 * Notifications externes : webhook HTTP + trace en base (notification_events).
 * Optionnel : définir NOTIFICATION_WEBHOOK_URL (Make, Zapier, votre backend SMS/WhatsApp).
 */

import { createRecords, isInsforgeConfigured } from "./insforge";

/**
 * @param {object} row Ligne package avant MAJ (champs utiles pour le payload).
 * @param {string} previousStatus
 * @param {string} newStatus
 */
export async function notifyPackageStatusChange({ row, previousStatus, newStatus }) {
  if (!row?.id || previousStatus === newStatus) return;

  const payload = {
    package_id: row.id,
    previous_status: previousStatus,
    new_status: newStatus,
    destination: row.destination,
    receiver_phone: row.receiver_phone,
    sender_phone: row.sender_phone,
  };

  try {
    if (isInsforgeConfigured()) {
      await createRecords("notification_events", [
        {
          package_id: row.id,
          event_type: "status_change",
          payload: JSON.stringify(payload),
        },
      ]);
    }
  } catch (e) {
    console.warn("[notify] notification_events:", e?.message || e);
  }

  const url = process.env.NOTIFICATION_WEBHOOK_URL?.trim();
  if (!url) return;

  try {
    const headers = { "Content-Type": "application/json" };
    const secret = process.env.NOTIFICATION_WEBHOOK_SECRET?.trim();
    if (secret) headers["x-webhook-secret"] = secret;

    await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("[notify] webhook:", e?.message || e);
  }
}
