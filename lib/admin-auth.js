import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  verifySessionToken,
} from "./admin-session";
import { ADMIN_PERMISSION_KEYS } from "./admin-permissions";

function openAdminMode() {
  return !process.env.ADMIN_SECRET?.trim();
}

/**
 * Lit cookie, header legacy, ou mode ouvert (sans ADMIN_SECRET).
 * @returns {{ ok: boolean, error?: string, legacy?: boolean, openMode?: boolean, isSuperAdmin?: boolean, permissions?: string[], userId?: string, email?: string }}
 */
export function getAdminAuth(request) {
  if (openAdminMode()) {
    return {
      ok: true,
      openMode: true,
      legacy: true,
      isSuperAdmin: true,
      permissions: [...ADMIN_PERMISSION_KEYS],
    };
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const payload = token ? verifySessionToken(token) : null;

  if (payload?.typ === "legacy") {
    return {
      ok: true,
      legacy: true,
      isSuperAdmin: true,
      permissions: [...ADMIN_PERMISSION_KEYS],
    };
  }

  if (payload?.typ === "user") {
    const isSuperAdmin = Boolean(payload.super);
    const permissions = isSuperAdmin
      ? [...ADMIN_PERMISSION_KEYS]
      : Array.isArray(payload.perm)
        ? payload.perm
        : [];
    return {
      ok: true,
      legacy: false,
      isSuperAdmin,
      permissions,
      userId: payload.sub,
      email: payload.email,
    };
  }

  const hdr = request.headers.get("x-admin-secret");
  const secret = process.env.ADMIN_SECRET?.trim();
  if (secret && hdr === secret) {
    return {
      ok: true,
      legacy: true,
      isSuperAdmin: true,
      permissions: [...ADMIN_PERMISSION_KEYS],
    };
  }

  return { ok: false, error: "Non autorisé" };
}

/**
 * @param {import('next/server').NextRequest} request
 * @param {{ permission?: string }} [opts] — si défini, exige la clé (sauf super admin)
 */
export function requireAdmin(request, opts = {}) {
  const auth = getAdminAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error || "Non autorisé" }, { status: 401 });
  }
  const perm = opts.permission;
  if (
    perm &&
    !auth.isSuperAdmin &&
    !(auth.permissions || []).includes(perm)
  ) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }
  return null;
}
