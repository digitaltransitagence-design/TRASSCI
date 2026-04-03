import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/admin-auth";

export async function GET(request) {
  const auth = getAdminAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    openMode: Boolean(auth.openMode),
    legacy: Boolean(auth.legacy),
    isSuperAdmin: Boolean(auth.isSuperAdmin),
    permissions: auth.permissions || [],
    email: auth.email || null,
    userId: auth.userId || null,
  });
}
