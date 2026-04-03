/**
 * Règles tarifaires — lues depuis Insforge (destinations + app_settings), avec repli local.
 */

import { queryRecords, isInsforgeConfigured } from "./insforge";

const FALLBACK_DESTINATIONS = [
  { id: "korhogo", name: "Korhogo", price: 3000, active: true, sort_order: 1 },
  { id: "bouake", name: "Bouaké", price: 2000, active: true, sort_order: 2 },
  { id: "san-pedro", name: "San Pedro", price: 3500, active: true, sort_order: 3 },
  { id: "yamoussoukro", name: "Yamoussoukro", price: 1500, active: true, sort_order: 4 },
  { id: "man", name: "Man", price: 4000, active: true, sort_order: 5 },
];

const FALLBACK_FEES = {
  ramassage: 1500,
  insurance: 1000,
  depot: 0,
};

/** @returns {Promise<{ fees: { ramassage:number, insurance:number, depot:number }, destinations: Array<{id:string,name:string,price:number,active:boolean}> }>} */
export async function loadPricingRules() {
  if (!isInsforgeConfigured()) {
    return {
      fees: { ...FALLBACK_FEES },
      destinations: FALLBACK_DESTINATIONS.filter((d) => d.active),
    };
  }

  try {
    const [destRows, settingsRows] = await Promise.all([
      queryRecords("destinations", {
        active: "eq.true",
        order: "sort_order.asc",
        limit: "100",
      }).catch(() => null),
      queryRecords("app_settings", { limit: "50" }).catch(() => null),
    ]);

    let fees = { ...FALLBACK_FEES };
    if (settingsRows?.length) {
      for (const row of settingsRows) {
        const k = row.key;
        const v = parseInt(row.value, 10);
        if (k === "fee_ramassage" && !Number.isNaN(v)) fees.ramassage = v;
        if (k === "fee_insurance" && !Number.isNaN(v)) fees.insurance = v;
        if (k === "fee_depot" && !Number.isNaN(v)) fees.depot = v;
      }
    }

    let destinations = destRows?.length
      ? destRows
      : FALLBACK_DESTINATIONS;

    if (!destRows?.length) {
      fees = { ...FALLBACK_FEES };
      destinations = FALLBACK_DESTINATIONS;
    }

    return {
      fees,
      destinations: destinations.filter((d) => d.active !== false),
    };
  } catch {
    return {
      fees: { ...FALLBACK_FEES },
      destinations: FALLBACK_DESTINATIONS.filter((d) => d.active),
    };
  }
}

/**
 * @param {object} body - destination (id slug), delivery_mode, has_insurance
 * @param {Awaited<ReturnType<typeof loadPricingRules>>} [rules]
 */
export function computePriceFromRules(body, rules) {
  const dest = rules.destinations.find(
    (d) => d.id === body.destination || d.name === body.destination
  );
  const destPrice = dest?.price ?? 0;
  const mode =
    body.delivery_mode === "ramassage"
      ? rules.fees.ramassage
      : rules.fees.depot;
  const ins = body.has_insurance ? rules.fees.insurance : 0;
  return destPrice + mode + ins;
}

export { FALLBACK_FEES, FALLBACK_DESTINATIONS };
