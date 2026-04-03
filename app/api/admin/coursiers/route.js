import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createRecords, isInsforgeConfigured } from "@/lib/insforge";

export async function POST(request) {
  const denied = requireAdmin(request, { permission: "coursiers" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const id = (body.id || "").trim();
    const name = (body.name || "").trim();
    if (!id || !name) {
      return NextResponse.json(
        { error: "Identifiant et nom obligatoires." },
        { status: 400 }
      );
    }
    const phone = (body.phone || "").trim();
    const status = (body.status || "DISPONIBLE").trim() || "DISPONIBLE";
    await createRecords("coursiers", [{ id, name, phone, status }]);
    return NextResponse.json({ id, name, phone, status }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur (doublon d’id ?)" },
      { status: 500 }
    );
  }
}
