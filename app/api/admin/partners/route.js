import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  queryRecords,
  createRecords,
  isInsforgeConfigured,
} from "@/lib/insforge";

/** Liste complète des partenaires (y compris inactifs) pour configuration. */
export async function GET(request) {
  const denied = requireAdmin(request, { permission: "partners" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  try {
    const rows = await queryRecords("partners", {
      order: "name.asc",
      limit: "100",
    });
    return NextResponse.json({ partners: rows || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}

/** Création partenaire (id unique type P-XXX). */
export async function POST(request) {
  const denied = requireAdmin(request, { permission: "partners" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const id = String(body.id || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "-");
    const name = String(body.name || "").trim();
    if (!id || !name) {
      return NextResponse.json(
        { error: "id et name sont requis" },
        { status: 400 }
      );
    }
    const row = {
      id,
      name,
      route: String(body.route ?? "").trim(),
      contact: String(body.contact ?? "").trim(),
      conditions_text: String(body.conditions_text ?? "").trim(),
      whatsapp: String(body.whatsapp ?? "").trim(),
      address: String(body.address ?? "").trim(),
      active: body.active !== false,
    };
    await createRecords("partners", [row]);
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}
