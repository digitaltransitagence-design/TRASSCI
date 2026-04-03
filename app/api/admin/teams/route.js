import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/admin-auth";
import { createTeamWithPermissions, listTeams, getTeamPermissions } from "@/lib/admin-users";
import { isInsforgeConfigured } from "@/lib/insforge";

function forbidden() {
  return NextResponse.json({ error: "Interdit" }, { status: 403 });
}

export async function GET(request) {
  const auth = getAdminAuth(request);
  if (!auth.ok) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!auth.isSuperAdmin) return forbidden();
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  try {
    const teams = await listTeams();
    const withPerm = await Promise.all(
      teams.map(async (t) => ({
        ...t,
        permissions: await getTeamPermissions(t.id),
      }))
    );
    return NextResponse.json({ teams: withPerm });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Erreur" }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = getAdminAuth(request);
  if (!auth.ok) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!auth.isSuperAdmin) return forbidden();
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const slug = String(body.slug || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];
    if (!name || !slug) {
      return NextResponse.json({ error: "name et slug requis" }, { status: 400 });
    }
    const team = await createTeamWithPermissions(name, slug, permissions);
    return NextResponse.json({ team }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Erreur" }, { status: 500 });
  }
}
