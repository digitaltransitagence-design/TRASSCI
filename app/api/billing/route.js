import { NextResponse } from "next/server";

/** Placeholder — intégration future (CinetPay, Orange Money, Stripe, etc.) */
export async function GET() {
  return NextResponse.json({
    integrated: false,
    message:
      "Paiement en ligne : non branché. Prévoir un agrégateur local (Mobile Money, carte) et exposer une route de confirmation.",
    env: [
      "BILLING_PROVIDER (ex. cinetpay)",
      "BILLING_SECRET_KEY",
      "NEXT_PUBLIC_BILLING_ENABLED=true pour activer l’UI",
    ],
  });
}
