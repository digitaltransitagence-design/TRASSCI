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

    /* Resend (compte sans domaine vérifié) : envois de test limités à l’e-mail du compte. */
    if (
      /only send testing emails|verify a domain|testing emails to your own/i.test(
        msg
      )
    ) {
      return NextResponse.json({
        ok: true,
        mode: "stub",
        reason: "resend_sandbox",
        message:
          "Resend (mode test) : sans domaine vérifié, l’envoi ne peut aller qu’à l’adresse du compte Resend — ou vérifiez un domaine sur resend.com/domains et définissez RESEND_FROM avec une adresse @ce-domaine.",
        guide: getClientGuidePlainText(),
      });
    }

    return NextResponse.json({ error: msg || "Erreur" }, { status: 502 });
  }
}
