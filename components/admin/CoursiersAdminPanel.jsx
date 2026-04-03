"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Bike, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { adminFetch } from "@/components/admin/adminFetch";

export default function CoursiersAdminPanel({ onChanged }) {
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    id: "",
    name: "",
    phone: "",
    status: "DISPONIBLE",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coursiers", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setList(data.coursiers || []);
    } catch {
      showToast("Impossible de charger les coursiers.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function createCoursier(e) {
    e.preventDefault();
    try {
      const res = await adminFetch("/api/admin/coursiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        showToast("Code admin requis.", "error");
        return;
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Erreur");
      showToast("Coursier créé.", "success");
      setForm({ id: "", name: "", phone: "", status: "DISPONIBLE" });
      load();
      onChanged?.();
    } catch (e) {
      showToast(e.message || "Erreur création", "error");
    }
  }

  async function updateField(c, field, value) {
    try {
      const res = await adminFetch(`/api/admin/coursiers/${encodeURIComponent(c.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.status === 401) {
        showToast("Code admin requis.", "error");
        return;
      }
      if (!res.ok) throw new Error();
      showToast("Mis à jour.", "success");
      load();
      onChanged?.();
    } catch {
      showToast("Erreur mise à jour.", "error");
    }
  }

  async function remove(c) {
    if (!window.confirm(`Supprimer le coursier ${c.id} ?`)) return;
    try {
      const res = await adminFetch(`/api/admin/coursiers/${encodeURIComponent(c.id)}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        showToast("Code admin requis.", "error");
        return;
      }
      if (!res.ok) throw new Error();
      showToast("Coursier supprimé.", "success");
      load();
      onChanged?.();
    } catch {
      showToast("Erreur suppression (colis lié ?).", "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <form
        onSubmit={createCoursier}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-slate-800">
          <Bike className="h-6 w-6 text-orange-600" />
          Ajouter un coursier
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">
            ID (ex. C-03)
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 font-mono text-sm"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value.trim() })}
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Nom
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Téléphone
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Statut
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="DISPONIBLE">DISPONIBLE</option>
              <option value="EN_COURSE">EN_COURSE</option>
              <option value="PAUSE">PAUSE</option>
            </select>
          </label>
        </div>
        <Button type="submit" className="mt-4">
          Enregistrer
        </Button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-extrabold text-slate-800">Coursiers ({list.length})</h3>
        {loading ? (
          <p className="text-slate-500">Chargement…</p>
        ) : (
          <div className="space-y-4">
            {list.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="font-mono font-bold text-blue-900">{c.id}</div>
                <input
                  className="min-w-0 flex-1 rounded border border-slate-200 bg-white p-2 text-sm"
                  defaultValue={c.name}
                  onBlur={(e) => {
                    if (e.target.value !== c.name)
                      updateField(c, "name", e.target.value);
                  }}
                />
                <input
                  className="w-full rounded border border-slate-200 bg-white p-2 text-sm md:w-36"
                  defaultValue={c.phone}
                  onBlur={(e) => {
                    if (e.target.value !== c.phone)
                      updateField(c, "phone", e.target.value);
                  }}
                />
                <select
                  className="rounded border border-slate-200 bg-white p-2 text-sm md:w-40"
                  defaultValue={c.status}
                  onChange={(e) => updateField(c, "status", e.target.value)}
                >
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="EN_COURSE">EN_COURSE</option>
                  <option value="PAUSE">PAUSE</option>
                </select>
                <button
                  type="button"
                  className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  onClick={() => remove(c)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            {list.length === 0 && (
              <p className="text-sm text-slate-500">Aucun coursier.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
