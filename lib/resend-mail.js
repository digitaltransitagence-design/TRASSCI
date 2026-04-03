/**
 * Envoi transactionnel via Resend (SDK officiel).
 * Suivi des e-mails : https://resend.com/emails (aperçu, texte, HTML, événements).
 */
import { Resend } from "resend";

let resendSingleton = null;

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

export const CLIENT_GUIDE_SUBJECT =
  "Trass CI — Comment remplir votre formulaire d'envoi";

export function getClientGuidePlainText() {
  return `Trass CI — Guide rapide pour votre envoi

1. Expéditeur : nom et téléphone joignables (WhatsApp de préférence).
2. Destinataire : nom complet et numéro pour retrait en gare (CNI vérifiée).
3. Destination : choisissez la ville d'arrivée dans la liste.
4. Nature du colis : document, marchandise, électronique, etc. (impact assurance).
5. Mode : ramassage à domicile ou dépôt en agence.
6. Assurance : cochez si besoin et indiquez une valeur déclarée réaliste (FCFA).
7. Adresse de ramassage : précise si vous choisissez le ramassage.
8. Photo (optionnel) : lien vers une image du colis emballé.

En cas de doute, contactez le support indiqué sur le site.`;
}

export function getClientGuideHtml() {
  const items = [
    "Expéditeur : nom et téléphone joignables (WhatsApp de préférence).",
    "Destinataire : nom complet et numéro pour retrait en gare (CNI vérifiée).",
    "Destination : choisissez la ville d'arrivée dans la liste.",
    "Nature du colis : document, marchandise, électronique, etc. (impact assurance).",
    "Mode : ramassage à domicile ou dépôt en agence.",
    "Assurance : cochez si besoin et indiquez une valeur déclarée réaliste (FCFA).",
    "Adresse de ramassage : précise si vous choisissez le ramassage.",
    "Photo (optionnel) : lien vers une image du colis emballé.",
  ];
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1e293b;max-width:560px;margin:0 auto;padding:24px;">
  <h1 style="color:#1e3a8a;font-size:20px;margin:0 0 16px;">Trass CI</h1>
  <p style="margin:0 0 16px;">Guide rapide pour remplir votre formulaire d'envoi :</p>
  <ol style="margin:0;padding-left:20px;">
    ${items.map((t) => `<li style="margin-bottom:8px;">${escapeHtml(t)}</li>`).join("")}
  </ol>
  <p style="margin-top:20px;font-size:14px;color:#64748b;">En cas de doute, contactez le support indiqué sur le site.</p>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {{ to: string }} params
 * @returns {Promise<{ id: string }>}
 */
export async function sendClientGuideEmail({ to }) {
  const resend = getResend();
  if (!resend) {
    throw new Error("RESEND_API_KEY manquant");
  }
  const from =
    process.env.RESEND_FROM?.trim() || "Trass CI <onboarding@resend.dev>";
  const replyTo = process.env.RESEND_REPLY_TO?.trim();

  const text = getClientGuidePlainText();
  const html = getClientGuideHtml();

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: CLIENT_GUIDE_SUBJECT,
    text,
    html,
    ...(replyTo ? { replyTo } : {}),
    tags: [
      { name: "app", value: "trass-ci" },
      { name: "type", value: "client-guide" },
    ],
  });

  if (error) {
    throw new Error(error.message || "Échec envoi Resend");
  }
  if (!data?.id) {
    throw new Error("Réponse Resend sans identifiant");
  }
  return { id: data.id };
}
