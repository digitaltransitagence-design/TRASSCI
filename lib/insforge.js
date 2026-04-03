/**
 * Client serveur Insforge (PostgREST) — utiliser uniquement côté serveur
 * (Route Handlers, Server Actions). Ne jamais importer dans un composant "use client".
 */

/** BOM Windows, espaces, guillemets autour de la valeur dans .env */
function normalizeEnvString(value) {
  if (typeof value !== "string") return "";
  let s = value.replace(/^\uFEFF/, "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function getConfig() {
  const baseUrl = normalizeEnvString(
    process.env.INSFORGE_API_URL ?? ""
  ).replace(/\/$/, "");
  // Clé projet (ik_…) : copier depuis le dashboard Insforge ou .insforge/project.json (api_key)
  const raw =
    process.env.INSFORGE_ANON_KEY || process.env.INSFORGE_API_KEY || "";
  const apiKey = normalizeEnvString(raw);
  return { baseUrl, apiKey };
}

export function isInsforgeConfigured() {
  const { baseUrl, apiKey } = getConfig();
  return Boolean(baseUrl && apiKey);
}

/** Évite les confusions JWT / mauvaise variable d’environnement */
function assertProjectApiKey(apiKey) {
  if (!apiKey) return;
  if (!apiKey.startsWith("ik_")) {
    throw new Error(
      "INSFORGE_ANON_KEY : la clé projet Insforge commence par ik_ (dashboard → API keys, ou champ api_key dans .insforge/project.json). Ce n’est pas un JWT utilisateur."
    );
  }
}

function headers(json = true) {
  const { apiKey } = getConfig();
  // Uniquement x-api-key : avec Authorization Bearer, certains déploiements
  // interprètent d’abord le JWT et renvoient 401 pour une clé ik_… valide.
  const h = { "x-api-key": apiKey };
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
  const { baseUrl, apiKey } = getConfig();
  if (!baseUrl) throw new Error("INSFORGE_API_URL manquant");
  assertProjectApiKey(apiKey);
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
  assertProjectApiKey(getConfig().apiKey);
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
  assertProjectApiKey(getConfig().apiKey);
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
