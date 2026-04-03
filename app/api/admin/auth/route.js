import { NextResponse } from "next/server";
import {
  signSessionPayload,
  ADMIN_SESSION_COOKIE,
  sessionCookieOptions,
  SESSION_MAX_AGE_SEC,
} from "@/lib/admin-session";
import { ADMIN_PERMISSION_KEYS } from "@/lib/admin-permissions";
import {
  adminSchemaReady,
  hasAnyAdminUser,
  findUserByEmail,
  verifyPassword,
  createUserRecord,
  createTeamWithPermissions,
  getPermissionsForUserRow,
} from "@/lib/admin-users";

function exp() {
  return Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
}

export async function POST(request) {
  const expected = process.env.ADMIN_SECRET?.trim();
  const open = !expected;

  if (open) {
    const res = NextResponse.json({ ok: true, mode: "open" });
    try {
      const token = signSessionPayload({ v: 1, typ: "legacy", exp: exp() });
      res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    } catch {
      /* pas de clé de signature */
    }
    return res;
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const schemaReady = await adminSchemaReady();
  const hasUsers = schemaReady && (await hasAnyAdminUser());

  if (body.email && body.password) {
    if (!schemaReady || !hasUsers) {
      return NextResponse.json(
        { error: "Aucun compte : exécutez la migration SQL admin ou créez le premier compte." },
        { status: 400 }
      );
    }
    const u = await findUserByEmail(body.email);
    if (!u || !verifyPassword(body.password, u.password_hash)) {
      return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
    }
    const perms = await getPermissionsForUserRow(u);
    const token = signSessionPayload({
      v: 1,
      typ: "user",
      sub: u.id,
      email: u.email,
      exp: exp(),
      super: Boolean(u.is_super_admin),
      perm: u.is_super_admin ? ADMIN_PERMISSION_KEYS : perms,
    });
    const res = NextResponse.json({ ok: true, mode: "user" });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  }

  if (body.bootstrap && schemaReady && !hasUsers) {
    const sec = String(body.secret || "").trim();
    if (sec !== expected) {
      return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
    }
    const email = String(body.bootstrap.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.bootstrap.password || "");
    const displayName = String(body.bootstrap.displayName || "Administrateur");
    const teamName = String(body.bootstrap.teamName || "Siège");
    if (!email || password.length < 8) {
      return NextResponse.json(
        { error: "Email et mot de passe (8 caractères minimum) requis." },
        { status: 400 }
      );
    }
    const slug = `siege-${Date.now().toString(36)}`;
    const team = await createTeamWithPermissions(teamName, slug, [...ADMIN_PERMISSION_KEYS]);
    const user = await createUserRecord({
      email,
      password,
      displayName,
      teamId: team?.id,
      isSuperAdmin: true,
    });
    const token = signSessionPayload({
      v: 1,
      typ: "user",
      sub: user.id,
      email: user.email,
      exp: exp(),
      super: true,
      perm: [...ADMIN_PERMISSION_KEYS],
    });
    const res = NextResponse.json({ ok: true, mode: "bootstrap" });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  }

  if (body.secret !== undefined) {
    const sec = String(body.secret || "").trim();
    if (sec !== expected) {
      return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
    }
    if (hasUsers) {
      return NextResponse.json(
        {
          error:
            "Des comptes existent : connectez-vous avec votre e-mail et mot de passe.",
        },
        { status: 400 }
      );
    }
    const token = signSessionPayload({ v: 1, typ: "legacy", exp: exp() });
    const res = NextResponse.json({ ok: true, mode: "legacy" });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  }

  return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
}
