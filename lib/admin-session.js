import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "trass_admin_token";

/** Durée de session (secondes). */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function signingKey() {
  const k = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SECRET;
  return k && String(k).trim() ? String(k).trim() : "";
}

export function signSessionPayload(payload) {
  const key = signingKey();
  if (!key) throw new Error("ADMIN_SESSION_SECRET ou ADMIN_SECRET requis pour les sessions");
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const key = signingKey();
  if (!key) return null;
  const expected = createHmac("sha256", key).update(body).digest("base64url");
  try {
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const json = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (json.exp && Math.floor(Date.now() / 1000) > json.exp) return null;
    return json;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}
