"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { adminFetch } from "@/components/admin/adminFetch";
import { ADMIN_PERMISSION_KEYS, ADMIN_PERMISSION_LABELS } from "@/lib/admin-permissions";
import { Shield, Users } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export default function AdminAccessPanel() {
  const { showToast } = useToast();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTeam, setNewTeam] = useState({ name: "", slug: "" });
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    displayName: "",
    team_id: "",
    is_super_admin: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tr, ur] = await Promise.all([
        adminFetch("/api/admin/teams"),
        adminFetch("/api/admin/users"),
      ]);
      if (tr.ok) {
        const j = await tr.json();
        setTeams(j.teams || []);
      }
      if (ur.ok) {
        const j = await ur.json();
        setUsers(j.users || []);
      }
    } catch {
      showToast("Erreur chargement équipes.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function createTeam(e) {
    e.preventDefault();
    try {
      const res = await adminFetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeam.name.trim(),
          slug: newTeam.slug.trim() || newTeam.name.trim().toLowerCase().replace(/\s+/g, "-"),
          permissions: [...ADMIN_PERMISSION_KEYS].filter((k) => k !== "teams"),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Erreur");
      showToast("Équipe créée.", "success");
      setNewTeam({ name: "", slug: "" });
      load();
    } catch (e) {
      showToast(e.message || "Erreur", "error");
    }
  }

  async function updateTeamPerms(team, keys) {
    try {
      const res = await adminFetch(`/api/admin/teams/${encodeURIComponent(team.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: keys }),
      });
      if (!res.ok) throw new Error();
      showToast("Permissions mises à jour.", "success");
      load();
    } catch {
      showToast("Erreur sauvegarde.", "error");
    }
  }

  async function createUser(e) {
    e.preventDefault();
    try {
      const res = await adminFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email.trim(),
          password: newUser.password,
          displayName: newUser.displayName.trim(),
          team_id: newUser.team_id || null,
          is_super_admin: newUser.is_super_admin,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Erreur");
      showToast("Utilisateur créé.", "success");
      setNewUser({
        email: "",
        password: "",
        displayName: "",
        team_id: "",
        is_super_admin: false,
      });
      load();
    } catch (e) {
      showToast(e.message || "Erreur", "error");
    }
  }

  function togglePerm(team, key) {
    const cur = new Set(team.permissions || []);
    if (cur.has(key)) cur.delete(key);
    else cur.add(key);
    updateTeamPerms(team, [...cur]);
  }

  if (loading) {
    return <p className="text-slate-600">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-slate-800">
          <Shield className="h-6 w-6 text-violet-600" />
          Équipes & permissions
        </h3>
        <p className="mb-6 text-sm text-slate-600">
          Chaque équipe reçoit des droits sur les modules (hors super administrateur, qui a tout).
        </p>
        <form onSubmit={createTeam} className="mb-8 flex flex-wrap gap-2 border-b border-slate-100 pb-8">
          <input
            className="min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Nom équipe"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
          />
          <input
            className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="slug-unique"
            value={newTeam.slug}
            onChange={(e) => setNewTeam({ ...newTeam, slug: e.target.value })}
          />
          <Button type="submit">Créer l&apos;équipe</Button>
        </form>

        <div className="space-y-6">
          {teams.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-bold text-slate-800">{t.name}</p>
              <p className="text-xs text-slate-500">{t.slug}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ADMIN_PERMISSION_KEYS.filter((k) => k !== "teams").map((k) => (
                  <label
                    key={k}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-white bg-white px-2 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={(t.permissions || []).includes(k)}
                      onChange={() => togglePerm(t, k)}
                    />
                    {ADMIN_PERMISSION_LABELS[k] || k}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <p className="text-sm text-slate-500">Aucune équipe (migration SQL exécutée ?).</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-slate-800">
          <Users className="h-6 w-6 text-blue-600" />
          Comptes utilisateurs
        </h3>
        <form onSubmit={createUser} className="mb-6 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            type="email"
            placeholder="E-mail"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            type="password"
            placeholder="Mot de passe (8+ caractères)"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Nom affiché"
            value={newUser.displayName}
            onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
          />
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={newUser.team_id}
            onChange={(e) => setNewUser({ ...newUser, team_id: e.target.value })}
          >
            <option value="">— Équipe —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={newUser.is_super_admin}
              onChange={(e) =>
                setNewUser({ ...newUser, is_super_admin: e.target.checked })
              }
            />
            Super administrateur (accès total)
          </label>
          <Button type="submit" className="sm:col-span-2">
            Créer le compte
          </Button>
        </form>

        <ul className="space-y-2 text-sm">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <span className="font-medium text-slate-800">{u.email}</span>
              <span className="text-slate-500">
                {u.is_super_admin ? "Super admin" : "Membre"}
                {u.display_name ? ` · ${u.display_name}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
