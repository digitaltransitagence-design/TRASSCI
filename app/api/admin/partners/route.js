import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { queryRecords, isInsforgeConfigured } from "@/lib/insforge";

/** Liste complète des partenaires (y compris inactifs) pour configuration. */
export async function GET(request) {
  const denied = requireAdmin(request);
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
