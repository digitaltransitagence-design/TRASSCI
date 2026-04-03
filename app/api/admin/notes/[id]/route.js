import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteRecords, isInsforgeConfigured } from "@/lib/insforge";

export async function DELETE(request, { params }) {
  const denied = requireAdmin(request, { permission: "notes" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  const { id } = await params;
  const raw = decodeURIComponent(id);
  try {
    await deleteRecords("admin_notes", `id=eq.${encodeURIComponent(raw)}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}
