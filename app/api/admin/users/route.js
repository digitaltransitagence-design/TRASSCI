import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/admin-auth";
import { listUsers, createUserRecord, findUserByEmail } from "@/lib/admin-users";
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
    const users = await listUsers();
    const safe = users.map((u) => ({
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      team_id: u.team_id,
      is_super_admin: u.is_super_admin,
      created_at: u.created_at,
    }));
    return NextResponse.json({ users: safe });
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
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const displayName = String(body.displayName || "").trim();
    const teamId = body.team_id || null;
    const isSuperAdmin = Boolean(body.is_super_admin);
    if (!email || password.length < 8) {
      return NextResponse.json(
        { error: "Email et mot de passe (8 caractères min.) requis" },
        { status: 400 }
      );
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 });
    }
    const user = await createUserRecord({
      email,
      password,
      displayName,
      teamId,
      isSuperAdmin,
    });
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          team_id: user.team_id,
          is_super_admin: user.is_super_admin,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Erreur" }, { status: 500 });
  }
}
