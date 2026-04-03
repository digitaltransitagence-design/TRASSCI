import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  queryRecords,
  createRecords,
  isInsforgeConfigured,
} from "@/lib/insforge";

export async function GET(request) {
  const denied = requireAdmin(request, { permission: "notes" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  try {
    const rows = await queryRecords("admin_notes", {
      order: "created_at.desc",
      limit: "200",
    });
    return NextResponse.json({ notes: rows || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const denied = requireAdmin(request, { permission: "notes" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const text = (body.body || "").trim();
    if (!text) {
      return NextResponse.json({ error: "Texte requis" }, { status: 400 });
    }
    const author_label = (body.author_label || "Admin").trim().slice(0, 80);
    await createRecords("admin_notes", [{ body: text, author_label }]);
    const rows = await queryRecords("admin_notes", {
      order: "created_at.desc",
      limit: "1",
    });
    return NextResponse.json({ note: rows?.[0] }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}
