import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { total, revenue, incidents } = await request.json();
    const prompt = `Tu es un directeur logistique senior en Côte d'Ivoire. L'entreprise Trass CI gère le flux Abidjan (collecte / hub) vers l'intérieur du pays (gares partenaires, remise au destinataire).

KPI actuels: ${total} colis en base, chiffre d'affaires cumulé ${revenue} FCFA, ${incidents} colis avec incident signalé.

Donne 4 recommandations stratégiques concrètes (puces courtes) pour: (1) réduire les incidents en gare et en transit, (2) améliorer la prévisibilité côté client (notifications / statuts), (3) optimiser la charge sur l'axe Abidjan–intérieur, (4) rentabilité sans promesse chiffrée inventée. Réponds en français, ton professionnel, sans jargon inutile.`;
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
