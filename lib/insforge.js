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
  // Dashboard « Connect Project » : champ **API Key** (ik_…), PAS « Anon Key » (JWT eyJ…).
  // Compat : INSFORGE_API_KEY en premier (nom aligné sur le dashboard), puis INSFORGE_ANON_KEY (ancien nom).
  const raw =
    process.env.INSFORGE_API_KEY || process.env.INSFORGE_ANON_KEY || "";
  const apiKey = normalizeEnvString(raw);
  return { baseUrl, apiKey };
}

export function isInsforgeConfigured() {
  const { baseUrl, apiKey } = getConfig();
  return Boolean(baseUrl && apiKey);
}

/**
 * Le JWT du champ dashboard « Anon Key » (eyJ…) ne sert pas comme x-api-key serveur.
 * Utiliser le champ **API Key** (préfixe ik_…).
 */
function assertNotJwtAsProjectKey(apiKey) {
  if (!apiKey) return;
  if (apiKey.startsWith("eyJ")) {
    throw new Error(
      "Vous avez collé la clé « Anon Key » du dashboard (JWT, commence par eyJ). Pour ce projet Next.js, mettez la clé du champ « API Key » (commence par ik_) dans INSFORGE_API_KEY ou INSFORGE_ANON_KEY."
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

function getFetchTimeoutMs() {
  const n = parseInt(process.env.INSFORGE_FETCH_TIMEOUT_MS || "20000", 10);
  return Number.isFinite(n) && n >= 5000 ? n : 20000;
}

/**
 * Évite les attentes infinies si Insforge ne répond pas (Vercel / réseau).
 */
async function insforgeFetch(fetchUrl, init = {}) {
  const ms = getFetchTimeoutMs();
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(fetchUrl, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (e?.name === "AbortError") {
      throw new Error(
        `Insforge: délai dépassé (${ms} ms) — le service ne répond pas assez vite.`
      );
    }
    throw e;
  } finally {
    clearTimeout(tid);
  }
}

/**
 * @param {string} table
 * @param {Record<string, string>} [query] PostgREST filters
 */
export async function queryRecords(table, query = {}) {
  const { baseUrl, apiKey } = getConfig();
  if (!baseUrl) throw new Error("INSFORGE_API_URL manquant");
  assertNotJwtAsProjectKey(apiKey);
  const params = new URLSearchParams(query);
  const qs = params.toString();
  const path = `/api/database/records/${encodeURIComponent(table)}${qs ? `?${qs}` : ""}`;
  const res = await insforgeFetch(url(path), {
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
  assertNotJwtAsProjectKey(getConfig().apiKey);
  const path = `/api/database/records/${encodeURIComponent(table)}`;
  const res = await insforgeFetch(url(path), {
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
  assertNotJwtAsProjectKey(getConfig().apiKey);
  const path = `/api/database/records/${encodeURIComponent(table)}?${idEq}`;
  const res = await insforgeFetch(url(path), {
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

/**
 * @param {string} table
 * @param {string} idEq PostgREST filter e.g. id=eq.xxx
 */
export async function deleteRecords(table, idEq) {
  assertNotJwtAsProjectKey(getConfig().apiKey);
  const path = `/api/database/records/${encodeURIComponent(table)}?${idEq}`;
  const res = await insforgeFetch(url(path), {
    method: "DELETE",
    headers: headers(false),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insforge delete ${table}: ${res.status} ${err}`);
  }
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}
