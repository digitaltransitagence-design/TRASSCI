/**
 * Comptes admin (Insforge). Échoue silencieusement si tables absentes.
 */
import bcrypt from "bcryptjs";
import { ADMIN_PERMISSION_KEYS } from "./admin-permissions";
import {
  queryRecords,
  createRecords,
  updateRecords,
  deleteRecords,
} from "./insforge";

export async function adminSchemaReady() {
  try {
    await queryRecords("admin_users", { limit: "1" });
    return true;
  } catch {
    return false;
  }
}

export async function hasAnyAdminUser() {
  try {
    const rows = await queryRecords("admin_users", { limit: "1" });
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

export async function findUserByEmail(email) {
  const e = String(email || "")
    .trim()
    .toLowerCase();
  if (!e) return null;
  const rows = await queryRecords("admin_users", { email: `eq.${e}`, limit: "1" });
  return rows?.[0] || null;
}

export async function getUserById(id) {
  const rows = await queryRecords("admin_users", { id: `eq.${id}`, limit: "1" });
  return rows?.[0] || null;
}

export async function listTeams() {
  try {
    return (await queryRecords("admin_teams", { order: "name.asc", limit: "200" })) || [];
  } catch {
    return [];
  }
}

export async function listUsers() {
  try {
    return (await queryRecords("admin_users", { order: "created_at.desc", limit: "200" })) || [];
  } catch {
    return [];
  }
}

export async function getTeamPermissions(teamId) {
  try {
    const rows = await queryRecords("admin_team_permissions", {
      team_id: `eq.${teamId}`,
      limit: "200",
    });
    return (rows || []).map((r) => r.permission_key).filter(Boolean);
  } catch {
    return [];
  }
}

export async function setTeamPermissions(teamId, keys) {
  await deleteRecords("admin_team_permissions", `team_id=eq.${encodeURIComponent(teamId)}`);
  const uniq = [...new Set(keys)].filter(Boolean);
  if (uniq.length === 0) return;
  await createRecords(
    "admin_team_permissions",
    uniq.map((permission_key) => ({ team_id: teamId, permission_key }))
  );
}

export async function createTeamWithPermissions(name, slug, permissionKeys) {
  const [team] = await createRecords("admin_teams", [{ name, slug }]);
  if (team?.id) await setTeamPermissions(team.id, permissionKeys);
  return team;
}

export async function createUserRecord({
  email,
  password,
  displayName,
  teamId,
  isSuperAdmin,
}) {
  const password_hash = bcrypt.hashSync(password, 10);
  const row = {
    email: email.trim().toLowerCase(),
    password_hash,
    display_name: displayName?.trim() || "",
    team_id: teamId || null,
    is_super_admin: Boolean(isSuperAdmin),
  };
  const [u] = await createRecords("admin_users", [row]);
  return u;
}

export async function updateUserRecord(id, patch) {
  const p = { ...patch };
  if (p.password) {
    p.password_hash = bcrypt.hashSync(p.password, 10);
    delete p.password;
  }
  await updateRecords("admin_users", `id=eq.${encodeURIComponent(id)}`, p);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

export async function getPermissionsForUserRow(user) {
  if (!user) return [];
  if (user.is_super_admin) return [...ADMIN_PERMISSION_KEYS];
  if (!user.team_id) return [];
  return getTeamPermissions(user.team_id);
}
