import { NextResponse } from "next/server";
import { buildGuidePdfBytes } from "@/lib/guide-pdf";

export const runtime = "nodejs";

/**
 * Téléchargement du guide en PDF (même contenu que l’e-mail Resend).
 */
export async function GET() {
  const pdfBytes = await buildGuidePdfBytes();
  const filename = "trass-ci-guide-formulaire-envoi.pdf";
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
