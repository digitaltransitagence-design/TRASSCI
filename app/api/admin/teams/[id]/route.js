import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/admin-auth";
import { setTeamPermissions } from "@/lib/admin-users";
import { updateRecords, isInsforgeConfigured } from "@/lib/insforge";

function forbidden() {
  return NextResponse.json({ error: "Interdit" }, { status: 403 });
}

export async function PATCH(request, { params }) {
  const auth = getAdminAuth(request);
  if (!auth.ok) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!auth.isSuperAdmin) return forbidden();
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  const { id } = await params;
  const raw = decodeURIComponent(id);
  try {
    const body = await request.json();
    if (body.name != null) {
      await updateRecords("admin_teams", `id=eq.${encodeURIComponent(raw)}`, {
        name: String(body.name).trim(),
      });
    }
    if (Array.isArray(body.permissions)) {
      await setTeamPermissions(raw, body.permissions);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Erreur" }, { status: 500 });
  }
}
