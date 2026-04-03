import { NextResponse } from "next/server";

/**
 * Vérifie le code admin (corps JSON { "secret": "..." }).
 * Si ADMIN_SECRET n’est pas défini, accès ouvert (développement).
 */
export async function POST(request) {
  const expected = process.env.ADMIN_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ ok: true, mode: "open" });
  }
  try {
    const body = await request.json();
    const sent = (body.secret || "").trim();
    if (sent !== expected) {
      return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}
