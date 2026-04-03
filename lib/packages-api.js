/**
 * Logique métier colis + historique (appelée depuis les Route Handlers).
 */

import {
  createRecords,
  queryRecords,
  updateRecords,
  isInsforgeConfigured,
} from "./insforge";
import { loadPricingRules, computePriceFromRules } from "./pricing";
import { notifyPackageStatusChange } from "./notify";

export async function computePrice(payload) {
  const rules = await loadPricingRules();
  return computePriceFromRules(payload, rules);
}

export async function fetchPackageWithHistory(id) {
  const rows = await queryRecords("packages", { id: `eq.${id}` });
  if (!rows?.length) return null;
  const pkg = rows[0];
  const history = await queryRecords("package_history", {
    package_id: `eq.${id}`,
    order: "created_at.asc",
    limit: "200",
  });
  const hist = (history || []).map((h) => ({
    ...h,
    date: h.date_text,
  }));
  return { package: pkg, history: hist };
}

export async function listPackages() {
  return queryRecords("packages", {
    order: "created_at.desc",
    limit: "500",
  });
}

export async function insertPackageAndHistory(payload) {
  const price = await computePrice(payload);
  const row = {
    id: payload.id,
    sender_name: payload.sender_name,
    sender_phone: payload.sender_phone,
    receiver_name: payload.receiver_name ?? "",
    receiver_phone: payload.receiver_phone,
    declared_value: Number(payload.declared_value) || 0,
    destination: payload.destination,
    nature: payload.nature,
    delivery_mode: payload.delivery_mode,
    has_insurance: payload.has_insurance,
    price,
    status: "PENDING",
    partner_id: null,
    coursier_id: null,
    photo_url: payload.photo_url ?? null,
    issue: null,
    rating: null,
    pickup_address: payload.pickup_address ?? null,
    description: payload.description ?? null,
  };
  await createRecords("packages", [row]);
  const now = new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  await createRecords("package_history", [
    {
      package_id: payload.id,
      status: "PENDING",
      date_text: now,
      author: "Client (Web)",
    },
  ]);
  return fetchPackageWithHistory(payload.id);
}

export async function patchPackage(id, patch, options = {}) {
  const { author = "Système", appendHistory = true } = options;
  const prev = await queryRecords("packages", { id: `eq.${id}` });
  if (!prev?.length) throw new Error("Colis introuvable");
  const oldStatus = prev[0].status;

  if (patch.rating !== undefined && patch.rating !== null) {
    const r = Number(patch.rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      throw new Error("Note invalide (1 à 5).");
    }
    if (prev[0].status !== "DELIVERED") {
      throw new Error("La note n'est possible qu'après livraison.");
    }
    if (prev[0].rating != null) {
      throw new Error("Note déjà enregistrée.");
    }
  }

  const updatePayload = {
    ...patch,
    updated_at: new Date().toISOString(),
  };
  delete updatePayload.appendHistory;
  delete updatePayload.author;
  await updateRecords("packages", `id=eq.${encodeURIComponent(id)}`, updatePayload);

  if (
    patch.status !== undefined &&
    patch.status !== oldStatus
  ) {
    await notifyPackageStatusChange({
      row: prev[0],
      previousStatus: oldStatus,
      newStatus: patch.status,
    });
  }

  const newStatus = patch.status ?? oldStatus;
  if (appendHistory && patch.status && patch.status !== oldStatus) {
    const now = new Date().toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    await createRecords("package_history", [
      {
        package_id: id,
        status: newStatus,
        date_text: now,
        author,
      },
    ]);
  }

  return fetchPackageWithHistory(id);
}

export { isInsforgeConfigured };
