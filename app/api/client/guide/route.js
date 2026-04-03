import { NextResponse } from "next/server";
import { getClientGuidePlainText } from "@/lib/resend-mail";

/**
 * Téléchargement du guide (même contenu que l’e-mail Resend).
 */
export async function GET() {
  const text = getClientGuidePlainText();
  const filename = "trass-ci-guide-formulaire-envoi.txt";
  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
