"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Plus, Trash2, Power } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { adminFetch } from "@/components/admin/adminFetch";

const emptyForm = {
  id: "",
  name: "",
  route: "",
  contact: "",
  whatsapp: "",
  address: "",
  conditions_text: "",
  active: true,
};

export default function PartnersAdminPanel({ onChanged }) {
  const { showToast } = useToast();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPartner, setEditingPartner] = useState(null);
  const [newPartner, setNewPartner] = useState(emptyForm);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/partners");
      if (res.status === 401) {
        showToast("Code admin requis (ADMIN_SECRET sur le serveur).", "error");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPartners(data.partners || []);
    } catch {
      showToast("Impossible de charger les partenaires.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  async function savePartner(p) {
    try {
      const res = await adminFetch(`/api/partners/${encodeURIComponent(p.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name,
          route: p.route,
          contact: p.contact,
          active: p.active,
          conditions_text: p.conditions_text,
          whatsapp: p.whatsapp,
          address: p.address,
        }),
      });
      if (res.status === 401) {
        showToast("Code admin requis.", "error");
        return;
      }
      if (!res.ok) throw new Error();
      showToast("Partenaire mis à jour.", "success");
      setEditingPartner(null);
      loadPartners();
      onChanged?.();
    } catch {
      showToast("Erreur enregistrement (migration SQL appliquée ?).", "error");
    }
  }

  async function toggleActive(p) {
    try {
      const res = await adminFetch(`/api/partners/${encodeURIComponent(p.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !p.active }),
      });
      if (res.status === 401) {
        showToast("Code admin requis.", "error");
        return;
      }
      if (!res.ok) throw new Error();
      showToast(!p.active ? "Partenaire activé." : "Partenaire désactivé.", "success");
      loadPartners();
      onChanged?.();
    } catch {
      showToast("Erreur mise à jour statut.", "error");
    }
  }

  async function createPartner(e) {
    e.preventDefault();
    const id = newPartner.id.trim().toUpperCase();
    const name = newPartner.name.trim();
    if (!id || !name) {
      showToast("Identifiant et nom requis.", "error");
      return;
    }
    try {
      const res = await adminFetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name,
          route: newPartner.route,
          contact: newPartner.contact,
          whatsapp: newPartner.whatsapp,
          address: newPartner.address,
          conditions_text: newPartner.conditions_text,
          active: newPartner.active,
        }),
      });
      if (res.status === 401) {
        showToast("Code admin requis.", "error");
        return;
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Erreur");
      showToast("Partenaire créé.", "success");
      setNewPartner(emptyForm);
      loadPartners();
      onChanged?.();
    } catch (e) {
      showToast(e.message || "Erreur création (id déjà utilisé ?).", "error");
    }
  }

  async function removePartner(p) {
    if (
      !window.confirm(
        `Supprimer définitivement le partenaire « ${p.name} » (${p.id}) ? Les colis liés perdront leur affectation gare.`
      )
    )
      return;
    try {
      const res = await adminFetch(`/api/partners/${encodeURIComponent(p.id)}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        showToast("Code admin requis.", "error");
        return;
      }
      if (!res.ok) throw new Error();
      showToast("Partenaire supprimé.", "success");
      setEditingPartner(null);
      loadPartners();
      onChanged?.();
    } catch {
      showToast("Erreur suppression.", "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <form
        onSubmit={createPartner}
        className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm"
      >
        <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-emerald-950">
          <Plus className="h-6 w-6" />
          Nouveau partenaire (gare / ligne)
        </h3>
        <p className="mb-4 text-sm text-emerald-900/80">
          Identifiant unique (ex. <code className="rounded bg-white px-1">P-NOM</code>), puis nom et
          coordonnées.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-emerald-200 bg-white p-2 text-sm"
            placeholder="ID — ex. P-ABT"
            value={newPartner.id}
            onChange={(e) => setNewPartner({ ...newPartner, id: e.target.value })}
          />
          <input
            className="rounded-lg border border-emerald-200 bg-white p-2 text-sm"
            placeholder="Nom affiché"
            value={newPartner.name}
            onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
          />
          <input
            className="rounded-lg border border-emerald-200 bg-white p-2 text-sm"
            placeholder="Axe / ligne"
            value={newPartner.route}
            onChange={(e) => setNewPartner({ ...newPartner, route: e.target.value })}
          />
          <input
            className="rounded-lg border border-emerald-200 bg-white p-2 text-sm"
            placeholder="Téléphone contact"
            value={newPartner.contact}
            onChange={(e) => setNewPartner({ ...newPartner, contact: e.target.value })}
          />
          <input
            className="rounded-lg border border-emerald-200 bg-white p-2 text-sm"
            placeholder="WhatsApp"
            value={newPartner.whatsapp}
            onChange={(e) => setNewPartner({ ...newPartner, whatsapp: e.target.value })}
          />
          <input
            className="rounded-lg border border-emerald-200 bg-white p-2 text-sm"
            placeholder="Adresse / point de rendez-vous"
            value={newPartner.address}
            onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })}
          />
        </div>
        <textarea
          className="mt-3 min-h-[72px] w-full rounded-lg border border-emerald-200 bg-white p-2 text-sm"
          placeholder="Conditions (horaires, refus…)"
          value={newPartner.conditions_text}
          onChange={(e) => setNewPartner({ ...newPartner, conditions_text: e.target.value })}
        />
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-emerald-900">
          <input
            type="checkbox"
            checked={newPartner.active}
            onChange={(e) => setNewPartner({ ...newPartner, active: e.target.checked })}
          />
          Actif dès la création (visible côté client si actif)
        </label>
        <Button type="submit" className="mt-4">
          Ajouter le partenaire
        </Button>
      </form>

      {loading ? (
        <p className="text-slate-600">Chargement des partenaires…</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-extrabold text-slate-800">Partenaires</h3>
          <p className="mb-6 text-sm text-slate-600">
            Gares, lignes, WhatsApp, adresses et conditions affichées côté client (si actif).
          </p>
          <div className="space-y-4">
            {partners.map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border p-4 ${
                  p.active ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-slate-100/80 opacity-90"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-blue-900">{p.id}</span>
                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                    {!p.active && (
                      <span className="rounded bg-slate-300 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      title={p.active ? "Désactiver" : "Activer"}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold ${
                        p.active
                          ? "border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      onClick={() => toggleActive(p)}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {p.active ? "Actif" : "Inactif"}
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() =>
                        setEditingPartner(editingPartner?.id === p.id ? null : { ...p })
                      }
                    >
                      {editingPartner?.id === p.id ? "Fermer" : "Modifier"}
                    </Button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                      title="Supprimer"
                      onClick={() => removePartner(p)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {editingPartner?.id === p.id && (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                    <input
                      className="w-full rounded border border-slate-200 p-2 text-sm"
                      value={editingPartner.name}
                      onChange={(e) =>
                        setEditingPartner({ ...editingPartner, name: e.target.value })
                      }
                      placeholder="Nom"
                    />
                    <input
                      className="w-full rounded border border-slate-200 p-2 text-sm"
                      value={editingPartner.route}
                      onChange={(e) =>
                        setEditingPartner({ ...editingPartner, route: e.target.value })
                      }
                      placeholder="Axe / ligne"
                    />
                    <input
                      className="w-full rounded border border-slate-200 p-2 text-sm"
                      value={editingPartner.contact}
                      onChange={(e) =>
                        setEditingPartner({
                          ...editingPartner,
                          contact: e.target.value,
                        })
                      }
                      placeholder="Téléphone contact"
                    />
                    <input
                      className="w-full rounded border border-slate-200 p-2 text-sm"
                      value={editingPartner.whatsapp || ""}
                      onChange={(e) =>
                        setEditingPartner({
                          ...editingPartner,
                          whatsapp: e.target.value,
                        })
                      }
                      placeholder="WhatsApp partenaire"
                    />
                    <input
                      className="w-full rounded border border-slate-200 p-2 text-sm"
                      value={editingPartner.address || ""}
                      onChange={(e) =>
                        setEditingPartner({
                          ...editingPartner,
                          address: e.target.value,
                        })
                      }
                      placeholder="Adresse ou point de rendez-vous"
                    />
                    <textarea
                      className="min-h-[100px] w-full rounded border border-slate-200 p-2 text-sm"
                      value={editingPartner.conditions_text || ""}
                      onChange={(e) =>
                        setEditingPartner({
                          ...editingPartner,
                          conditions_text: e.target.value,
                        })
                      }
                      placeholder="Conditions (horaires, refus, emballage…)"
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(editingPartner.active)}
                        onChange={(e) =>
                          setEditingPartner({ ...editingPartner, active: e.target.checked })
                        }
                      />
                      Partenaire actif (visible côté client)
                    </label>
                    <Button type="button" onClick={() => savePartner(editingPartner)}>
                      Enregistrer ce partenaire
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {partners.length === 0 && (
              <p className="text-sm text-slate-500">Aucun partenaire chargé.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
