import { NextResponse } from "next/server";

/** Si ADMIN_SECRET est défini, exiger le header x-admin-secret. */
export function requireAdmin(request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  const sent = request.headers.get("x-admin-secret");
  if (sent !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return null;
}
