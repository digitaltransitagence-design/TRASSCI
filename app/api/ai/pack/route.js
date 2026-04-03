import { NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(request) {
  try {
    const { description } = await request.json();
    if (!description?.trim()) {
      return NextResponse.json({ error: "Description requise" }, { status: 400 });
    }
    const prompt = `L'utilisateur veut expédier: "${description}". Détermine la catégorie principale parmi: Document, Vêtements, Électronique, Marchandise. Dis si c'est fragile (true/false). Donne exactement 2 conseils courts d'emballage en français. Réponds UNIQUEMENT en JSON valide avec les clés: categorie, fragile, conseils (tableau de 2 strings).`;
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
