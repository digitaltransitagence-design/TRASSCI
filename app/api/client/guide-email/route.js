import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import {
  isResendConfigured,
  sendClientGuideEmail,
  getClientGuidePlainText,
} from "@/lib/resend-mail";

/**
 * Envoie le guide par e-mail via Resend (visible dans le dashboard : aperçu, logs, événements).
 * @see https://resend.com/docs/dashboard/emails/introduction
 */
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const to = String(body.email || session.user.email).trim().toLowerCase();

    if (!isResendConfigured()) {
      return NextResponse.json({
        ok: true,
        mode: "stub",
        message:
          "RESEND_API_KEY non configuré — voici le guide ci-dessous. Créez une clé API sur https://resend.com/api-keys puis ajoutez-la aux variables d'environnement.",
        guide: getClientGuidePlainText(),
      });
    }

    const { id } = await sendClientGuideEmail({ to });
    return NextResponse.json({
      ok: true,
      mode: "sent",
      id,
      dashboardUrl: "https://resend.com/emails",
    });
  } catch (e) {
    console.error(e);
    const msg = String(e?.message || e || "");

    /* Resend (sans domaine vérifié) : envois de test limités — détail côté serveur uniquement. */
    if (
      /only send testing emails|verify a domain|testing emails to your own/i.test(
        msg
      )
    ) {
      console.warn("[guide-email] Limite Resend (domaine / destinataire) :", msg);
      return NextResponse.json({
        ok: true,
        mode: "stub",
        reason: "resend_sandbox",
        message:
          "Nous n’avons pas pu envoyer l’e-mail sur votre boîte pour le moment. Le guide est disponible ci-dessous sur cette page.",
        guide: getClientGuidePlainText(),
      });
    }

    return NextResponse.json({ error: msg || "Erreur" }, { status: 502 });
  }
}
