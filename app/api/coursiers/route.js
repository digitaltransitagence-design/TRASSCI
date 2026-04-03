import { NextResponse } from "next/server";
import { queryRecords, isInsforgeConfigured } from "@/lib/insforge";

export async function GET() {
  if (!isInsforgeConfigured()) {
    return NextResponse.json(
      { error: "Insforge non configuré" },
      { status: 503 }
    );
  }
  try {
    const rows = await queryRecords("coursiers", {
      order: "name.asc",
      limit: "100",
    });
    return NextResponse.json({ coursiers: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}
