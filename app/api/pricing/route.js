import { NextResponse } from "next/server";
import { loadPricingRules } from "@/lib/pricing";

/** Tarifs publics (destinations actives + frais) pour le formulaire client. */
export async function GET() {
  try {
    const rules = await loadPricingRules();
    return NextResponse.json(rules);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Impossible de charger les tarifs" },
      { status: 500 }
    );
  }
}
