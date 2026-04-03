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
    return NextResponse.json({ error: e.message || "Erreur" }, { status: 502 });
  }
}
