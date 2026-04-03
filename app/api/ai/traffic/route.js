import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { address, destination } = await request.json();
    if (!address?.trim()) {
      return NextResponse.json({ error: "Adresse requise" }, { status: 400 });
    }
    const prompt = `Tu es un assistant logistique terrain à Abidjan (Côte d'Ivoire), pour un coursier qui doit récupérer un colis puis le ramener vers le hub / les gares partenaires pour un envoi vers l'intérieur.

Adresse de ramassage: "${address}".
Destination du colis (ville intérieur): "${destination || "non précisée"}".

Donne 4 à 6 phrases courtes en français: accès quartier, circulation (sans inventer de temps réel), zones souvent congestionnées (ex. approches gares, marchés), prudence pluie / routes glissantes, et attitude professionnelle en gare. Ne cite pas de données GPS ou d'heures précises inventées. Ton: opérationnel, utile pour une moto ou petite camionnette.`;
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
