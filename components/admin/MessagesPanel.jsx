"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { MessageSquare, AlertCircle } from "lucide-react";

const STORAGE_NOTES = "trass_admin_internal_notes";

export default function MessagesPanel({ packages = [] }) {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_NOTES);
      setNotes(raw ? JSON.parse(raw) : []);
    } catch {
      setNotes([]);
    }
  }, []);

  function persist(next) {
    setNotes(next);
    try {
      localStorage.setItem(STORAGE_NOTES, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function addNote() {
    const t = draft.trim();
    if (!t) return;
    persist([
      {
        id: `n-${Date.now()}`,
        text: t,
        at: new Date().toISOString(),
      },
      ...notes,
    ]);
    setDraft("");
  }

  function removeNote(id) {
    persist(notes.filter((n) => n.id !== id));
  }

  const incidents = packages.filter((p) => p.issue);

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-slate-800">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          Notes internes
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          Mémo équipe (stockage local sur ce navigateur). Utile pour relances et consignes.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <textarea
            className="min-h-[88px] flex-1 rounded-xl border border-slate-200 p-3 text-sm"
            placeholder="Ajouter une note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="button" className="shrink-0 self-end sm:self-stretch" onClick={addNote}>
            Publier
          </Button>
        </div>
        <ul className="mt-6 space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm"
            >
              <div>
                <p className="whitespace-pre-wrap text-slate-800">{n.text}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(n.at).toLocaleString("fr-FR")}
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
          {notes.length === 0 && (
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
