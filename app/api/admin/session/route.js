import { NextResponse } from "next/server";
import { adminSchemaReady, hasAnyAdminUser } from "@/lib/admin-users";

/** Indique si code admin / comptes — pour l’UI de connexion. */
export async function GET() {
  const schema = await adminSchemaReady();
  const hasUsers = schema && (await hasAnyAdminUser());
  return NextResponse.json({
    adminSecretRequired: Boolean(process.env.ADMIN_SECRET?.trim()),
    adminSchemaReady: schema,
    hasUserAccounts: hasUsers,
  });
}
