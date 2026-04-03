import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { address, destination } = await request.json();
    if (!address?.trim()) {
      return NextResponse.json({ error: "Adresse requise" }, { status: 400 });
    }
    const prompt = `Tu es un assistant logistique à Abidjan, Côte d'Ivoire. Adresse de ramassage: "${address}". Destination colis: "${destination || "non précisée"}". Donne 3 à 5 phrases courtes en français sur les points de vigilance trafic / accès (Adjamé, heures de pointe, pluie) — pas de données temps réel inventées, reste prudent et utile pour un coursier moto.`;
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
