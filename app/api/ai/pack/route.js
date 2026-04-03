import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { description } = await request.json();
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description requise" }, { status: 400 });
    }
    const prompt = `Contexte: expédition colis en Côte d'Ivoire, trajet souvent long (Abidjan vers l'intérieur: chaleur, humidité, vibrations routières, manutention en gare). L'utilisateur décrit: "${description}".

Tâche: déduis la catégorie parmi Document, Vêtements, Électronique, Marchandise. Indique fragile (true/false) si casse/vibration/humidité sont un risque. Donne exactement 2 conseils courts d'emballage adaptés au contexte ivoirien (papier bulle, étanchéité, calage, étiquetage).

Réponds UNIQUEMENT en JSON valide: {"categorie":"...","fragile":true|false,"conseils":["...","..."]}`;
    const text = await generateContent(prompt, { json: true });
    if (!text) {
      return NextResponse.json(
        { error: "IA indisponible (GEMINI_API_KEY ?)" },
        { status: 503 }
      );
    }
    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Analyse impossible" },
      { status: 500 }
    );
  }
}
