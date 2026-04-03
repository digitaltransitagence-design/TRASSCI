import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  updateRecords,
  deleteRecords,
  isInsforgeConfigured,
} from "@/lib/insforge";

export async function PATCH(request, { params }) {
  const denied = requireAdmin(request, { permission: "coursiers" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  const { id } = await params;
  const raw = decodeURIComponent(id);
  try {
    const body = await request.json();
    const patch = {};
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.phone !== undefined) patch.phone = String(body.phone).trim();
    if (body.status !== undefined) patch.status = String(body.status).trim();
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
    }
    patch.updated_at = new Date().toISOString();
    const rows = await updateRecords(
      "coursiers",
      `id=eq.${encodeURIComponent(raw)}`,
      patch
    );
    const row = Array.isArray(rows) ? rows[0] : rows;
    return NextResponse.json({ coursier: row });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const denied = requireAdmin(request, { permission: "coursiers" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  const { id } = await params;
  const raw = decodeURIComponent(id);
  try {
    await deleteRecords("coursiers", `id=eq.${encodeURIComponent(raw)}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}
