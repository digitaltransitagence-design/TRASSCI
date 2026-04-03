/**
 * Comptes expéditeurs (espace client) — Insforge.
 */
import bcrypt from "bcryptjs";
import {
  queryRecords,
  createRecords,
  updateRecords,
  isInsforgeConfigured,
} from "./insforge";

export async function clientAccountsReady() {
  if (!isInsforgeConfigured()) return false;
  try {
    await queryRecords("client_accounts", { limit: "1" });
    return true;
  } catch {
    return false;
  }
}

export async function findClientByEmail(email) {
  const e = String(email || "")
    .trim()
    .toLowerCase();
  if (!e) return null;
  const rows = await queryRecords("client_accounts", {
    email: `eq.${e}`,
    limit: "1",
  });
  return rows?.[0] || null;
}

export async function findClientByGoogleId(googleId) {
  if (!googleId) return null;
  const rows = await queryRecords("client_accounts", {
    google_id: `eq.${googleId}`,
    limit: "1",
  });
  return rows?.[0] || null;
}

export async function createClientWithPassword({ email, password, name }) {
  const password_hash = bcrypt.hashSync(password, 10);
  const [row] = await createRecords("client_accounts", [
    {
      email: email.trim().toLowerCase(),
      password_hash,
      name: (name || "").trim(),
    },
  ]);
  return row;
}

export function verifyClientPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compareSync(plain, hash);
}

export async function upsertGoogleUser({ email, name, googleId, image }) {
  const e = email.trim().toLowerCase();
  const existing = await findClientByEmail(e);
  const now = new Date().toISOString();
  if (existing) {
    await updateRecords(
      "client_accounts",
      `id=eq.${encodeURIComponent(existing.id)}`,
      {
        google_id: googleId,
        name: name || existing.name,
        image: image || existing.image,
        updated_at: now,
      }
    );
    return { ...existing, google_id: googleId, name: name || existing.name,
      image: image || existing.image };
  }
  const [row] = await createRecords("client_accounts", [
    {
      email: e,
      name: (name || "").trim(),
      google_id: googleId,
      image: image || null,
      password_hash: null,
    },
  ]);
  return row;
}
