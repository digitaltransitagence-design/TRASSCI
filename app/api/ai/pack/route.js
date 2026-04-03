import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { description, declared_value } = await request.json();
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description requise" }, { status: 400 });
    }
    const val =
      declared_value != null && declared_value !== ""
        ? ` Valeur déclarée indicative: ${declared_value} FCFA.`
        : "";
    const prompt = `Contexte: expédition colis en Côte d'Ivoire (axe Abidjan → intérieur: chaleur, humidité, vibrations, manutention en gare).${val}
Description du contenu: "${description}"

Tâche: déduis la catégorie principale parmi EXACTEMENT: Document, Vêtements, Électronique, Marchandise, Écrans & TV (pour téléviseurs, moniteurs, très grands écrans — risque casse maximal).
Indique fragile = true si casse, chocs ou humidité sont un risque sérieux.
Donne exactement 2 conseils courts d'emballage (calage, double carton, marche en hauteur si TV).

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
