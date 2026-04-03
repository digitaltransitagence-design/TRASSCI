import { NextResponse } from "next/server";
import {
  clientAccountsReady,
  findClientByEmail,
  createClientWithPassword,
} from "@/lib/client-accounts";

export async function POST(request) {
  if (!(await clientAccountsReady())) {
    return NextResponse.json(
      {
        error:
          "Comptes client indisponibles — exécutez sql/migration_v5_client_auth.sql sur Insforge.",
      },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    if (!email || password.length < 8) {
      return NextResponse.json(
        { error: "E-mail valide et mot de passe (8 caractères minimum) requis." },
        { status: 400 }
      );
    }
    const existing = await findClientByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet e-mail." }, { status: 400 });
    }
    await createClientWithPassword({ email, password, name });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Erreur" }, { status: 500 });
  }
}
