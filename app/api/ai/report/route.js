import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { total, revenue, incidents } = await request.json();
    const prompt = `Entreprise logistique en Côte d'Ivoire. KPI: ${total} colis, CA ${revenue} FCFA, ${incidents} incidents signalés. Comme directeur logistique expérimenté, donne 3 recommandations stratégiques très courtes avec puces pour améliorer rentabilité et réduire incidents sur l'axe Abidjan–intérieur. Réponds en français, ton professionnel.`;
    const text = await generateContent(prompt, { json: false });
    if (!text) {
      return NextResponse.json(
        { error: "IA indisponible" },
        { status: 503 }
      );
    }
    return NextResponse.json({ text: text.trim() });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}
