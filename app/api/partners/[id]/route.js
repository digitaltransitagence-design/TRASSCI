import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateRecords, isInsforgeConfigured } from "@/lib/insforge";

/** Mise à jour partenaire (conditions, WhatsApp, adresse, contact). */
export async function PATCH(request, { params }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const patch = {
      updated_at: new Date().toISOString(),
    };
    if (body.name != null) patch.name = body.name;
    if (body.route != null) patch.route = body.route;
    if (body.contact != null) patch.contact = body.contact;
    if (body.active != null) patch.active = body.active;
    if (body.conditions_text != null) patch.conditions_text = body.conditions_text;
    if (body.whatsapp != null) patch.whatsapp = body.whatsapp;
    if (body.address != null) patch.address = body.address;

    await updateRecords(
      "partners",
      `id=eq.${encodeURIComponent(decodeURIComponent(id))}`,
      patch
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}
