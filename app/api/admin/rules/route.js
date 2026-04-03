import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  queryRecords,
  createRecords,
  updateRecords,
  isInsforgeConfigured,
} from "@/lib/insforge";
import { loadPricingRules, FALLBACK_FEES, FALLBACK_DESTINATIONS } from "@/lib/pricing";

async function getAllDestinations() {
  try {
    const rows = await queryRecords("destinations", {
      order: "sort_order.asc",
      limit: "200",
    });
    return rows?.length ? rows : FALLBACK_DESTINATIONS;
  } catch {
    return FALLBACK_DESTINATIONS;
  }
}

async function getAllSettings() {
  try {
    const rows = await queryRecords("app_settings", { limit: "50" });
    return rows || [];
  } catch {
    return [];
  }
}

/** Liste complète (admin) : destinations + frais */
export async function GET(request) {
  const denied = requireAdmin(request, { permission: "rules" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({
      fees: FALLBACK_FEES,
      destinations: FALLBACK_DESTINATIONS,
      warning: "Insforge non configuré — valeurs par défaut",
    });
  }
  try {
    const [destinations, settingsRows] = await Promise.all([
      getAllDestinations(),
      getAllSettings(),
    ]);
    const fees = { ...FALLBACK_FEES };
    for (const row of settingsRows) {
      const v = parseInt(row.value, 10);
      if (row.key === "fee_ramassage" && !Number.isNaN(v)) fees.ramassage = v;
      if (row.key === "fee_insurance" && !Number.isNaN(v)) fees.insurance = v;
      if (row.key === "fee_depot" && !Number.isNaN(v)) fees.depot = v;
    }
    return NextResponse.json({ fees, destinations });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}

/** Mise à jour frais et/ou destinations */
export async function PUT(request) {
  const denied = requireAdmin(request, { permission: "rules" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json(
      { error: "Insforge requis pour enregistrer les règles" },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const { fees, destinations } = body;

    if (fees) {
      for (const [key, val] of [
        ["fee_ramassage", fees.ramassage],
        ["fee_insurance", fees.insurance],
        ["fee_depot", fees.depot],
      ]) {
        if (val === undefined) continue;
        await updateRecords(
          "app_settings",
          `key=eq.${encodeURIComponent(key)}`,
          {
            value: String(val),
            updated_at: new Date().toISOString(),
          }
        ).catch(async () => {
          await createRecords("app_settings", [
            {
              key,
              value: String(val),
              updated_at: new Date().toISOString(),
            },
          ]);
        });
      }
    }

    if (Array.isArray(destinations)) {
      for (const d of destinations) {
        if (!d.id || !d.name) continue;
        await updateRecords(
          "destinations",
          `id=eq.${encodeURIComponent(d.id)}`,
          {
            name: d.name,
            price: Number(d.price) || 0,
            active: d.active !== false,
            sort_order: Number(d.sort_order) || 0,
            updated_at: new Date().toISOString(),
          }
        ).catch(async () => {
          await createRecords("destinations", [
            {
              id: d.id,
              name: d.name,
              price: Number(d.price) || 0,
              active: d.active !== false,
              sort_order: Number(d.sort_order) || 0,
            },
          ]);
        });
      }
    }

    const rules = await loadPricingRules();
    return NextResponse.json({ ok: true, ...rules });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur sauvegarde" },
      { status: 500 }
    );
  }
}
