/**
 * Client serveur Insforge (PostgREST) — utiliser uniquement côté serveur
 * (Route Handlers, Server Actions). Ne jamais importer dans un composant "use client".
 */

function getConfig() {
  const baseUrl = process.env.INSFORGE_API_URL?.replace(/\/$/, "");
  // Clé projet (ik_…) : INSFORGE_ANON_KEY ou alias INSFORGE_API_KEY
  const raw =
    process.env.INSFORGE_ANON_KEY || process.env.INSFORGE_API_KEY || "";
  const apiKey = typeof raw === "string" ? raw.trim() : "";
  return { baseUrl, apiKey };
}

export function isInsforgeConfigured() {
  const { baseUrl, apiKey } = getConfig();
  return Boolean(baseUrl && apiKey);
}

function headers(json = true) {
  const { apiKey } = getConfig();
  const h = { "x-api-key": apiKey };
  if (apiKey) h.Authorization = `Bearer ${apiKey}`;
  if (json) h["Content-Type"] = "application/json";
  return h;
}

function url(path) {
  const { baseUrl } = getConfig();
  return `${baseUrl}${path}`;
}

/**
 * @param {string} table
 * @param {Record<string, string>} [query] PostgREST filters
 */
export async function queryRecords(table, query = {}) {
  const { baseUrl } = getConfig();
  if (!baseUrl) throw new Error("INSFORGE_API_URL manquant");
  const params = new URLSearchParams(query);
  const qs = params.toString();
  const path = `/api/database/records/${encodeURIComponent(table)}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url(path), {
    headers: headers(false),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insforge query ${table}: ${res.status} ${err}`);
  }
  return res.json();
}

/**
 * @param {string} table
 * @param {object[]} records
 */
export async function createRecords(table, records) {
  const path = `/api/database/records/${encodeURIComponent(table)}`;
  const res = await fetch(url(path), {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(records),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insforge create ${table}: ${res.status} ${err}`);
  }
  return res.json();
}

/**
 * @param {string} table
 * @param {string} idEq PostgREST id filter e.g. id=eq.TRASS-1234
 * @param {object} patch
 */
export async function updateRecords(table, idEq, patch) {
  const path = `/api/database/records/${encodeURIComponent(table)}?${idEq}`;
  const res = await fetch(url(path), {
    method: "PATCH",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insforge update ${table}: ${res.status} ${err}`);
  }
  return res.json();
}
