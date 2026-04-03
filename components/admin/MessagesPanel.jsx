"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { MessageSquare, AlertCircle } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

function adminHeaders() {
  if (typeof window === "undefined") return {};
  const s = sessionStorage.getItem("trass_admin_secret");
  return s ? { "x-admin-secret": s } : {};
}

export default function MessagesPanel({ packages = [] }) {
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");
  const [authorLabel, setAuthorLabel] = useState("Équipe");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notes", { headers: adminHeaders() });
      if (res.status === 401) {
        showToast("Code admin requis (ADMIN_SECRET + mémoriser le code).", "error");
        setNotes([]);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {
      showToast("Impossible de charger les notes (migration SQL appliquée ?).", "error");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function addNote() {
    const t = draft.trim();
    if (!t) return;
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({ body: t, author_label: authorLabel.trim() || "Admin" }),
      });
      if (res.status === 401) {
        showToast("Code admin requis.", "error");
        return;
      }
      if (!res.ok) throw new Error();
      setDraft("");
      showToast("Note enregistrée.", "success");
      load();
    } catch {
      showToast("Erreur d’enregistrement.", "error");
    }
  }

  async function removeNote(id) {
    if (!window.confirm("Supprimer cette note ?")) return;
    try {
      const res = await fetch(`/api/admin/notes/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      if (res.status === 401) {
        showToast("Code admin requis.", "error");
        return;
      }
      if (!res.ok) throw new Error();
      showToast("Note supprimée.", "success");
      load();
    } catch {
      showToast("Erreur suppression.", "error");
    }
  }

  const incidents = packages.filter((p) => p.issue);

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Notes en base (<code className="rounded bg-white px-1">admin_notes</code>) — même code admin
        que les règles. Si erreur « table / relation » : migration V3 déjà exécutée côté Insforge ?
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-slate-800">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          Notes internes (équipe)
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Visibles par tous les postes ayant le code admin — partagées sur la base Insforge.
        </p>
        <div className="mb-3 flex flex-wrap gap-3">
          <label className="text-xs font-bold text-slate-600">
            Signature
            <input
              className="mt-1 block w-40 rounded-lg border border-slate-200 px-2 py-1 text-sm"
              value={authorLabel}
              onChange={(e) => setAuthorLabel(e.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <textarea
            className="min-h-[88px] flex-1 rounded-xl border border-slate-200 p-3 text-sm"
            placeholder="Ajouter une note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={loading}
          />
          <Button
            type="button"
            className="shrink-0 self-end sm:self-stretch"
            onClick={addNote}
            disabled={loading}
          >
            Publier
          </Button>
        </div>
        <ul className="mt-6 space-y-3">
          {loading && (
            <li className="text-center text-sm text-slate-500">Chargement…</li>
          )}
          {!loading &&
            notes.map((n) => (
              <li
                key={n.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm"
              >
                <div>
                  <p className="whitespace-pre-wrap text-slate-800">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {n.author_label || "Admin"} ·{" "}
                    {n.created_at
                      ? new Date(n.created_at).toLocaleString("fr-FR")
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs text-red-600 hover:underline"
                  onClick={() => removeNote(n.id)}
                >
                  Supprimer
                </button>
              </li>
            ))}
          {!loading && notes.length === 0 && (
            <li className="text-center text-sm text-slate-500">Aucune note pour l’instant.</li>
          )}
        </ul>
      </div>

      <div className="rounded-2xl border border-red-100 bg-red-50/80 p-6 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-red-900">
          <AlertCircle className="h-6 w-6" />
          Incidents colis (issue)
        </h3>
        <p className="mb-4 text-sm text-red-800/90">
          Signalements enregistrés sur les envois en cours.
        </p>
        <div className="space-y-3">
          {incidents.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-red-200 bg-white p-4 text-sm"
            >
              <span className="font-mono font-bold text-blue-900">{p.id}</span>
              <span className="mx-2 text-slate-400">·</span>
              <span className="text-slate-600">{p.destination}</span>
              <p className="mt-2 font-medium text-red-800">{p.issue}</p>
            </div>
          ))}
          {incidents.length === 0 && (
            <p className="text-center text-sm text-red-700/80">Aucun incident ouvert.</p>
          )}
        </div>
      </div>
    </div>
  );
}
