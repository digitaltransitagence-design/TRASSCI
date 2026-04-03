import { NextResponse } from "next/server";

/** Indique si un code admin est requis côté client (variable ADMIN_SECRET sur le serveur). */
export async function GET() {
  return NextResponse.json({
    adminSecretRequired: Boolean(process.env.ADMIN_SECRET?.trim()),
  });
}
