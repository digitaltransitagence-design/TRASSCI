"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

function adminHeaders() {
  if (typeof window === "undefined") return {};
  const s = sessionStorage.getItem("trass_admin_secret");
  return s ? { "x-admin-secret": s } : {};
}

export default function RulesPanel() {
  const { showToast } = useToast();
  const [fees, setFees] = useState({ ramassage: 1500, insurance: 1000, depot: 0 });
  const [destinations, setDestinations] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rules", { headers: adminHeaders() });
      if (res.status === 401) {
        showToast("Code admin requis (variable ADMIN_SECRET sur le serveur).", "error");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFees(data.fees || { ramassage: 1500, insurance: 1000, depot: 0 });
      setDestinations(data.destinations || []);
    } catch {
      showToast("Impossible de charger les règles.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadPartners = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/partners", { headers: adminHeaders() });
      if (res.status === 401) return;
      if (!res.ok) return;
      const data = await res.json();
      setPartners(data.partners || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    loadPartners();
  }, [load, loadPartners]);

  async function saveRules() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify({ fees, destinations }),
      });
      if (res.status === 401) {
        showToast("Code admin incorrect.", "error");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur");
      }
      showToast("Règles enregistrées.", "success");
      load();
    } catch (e) {
      showToast(e.message || "Erreur sauvegarde", "error");
    } finally {
      setSaving(false);
    }
  }

  async function savePartner(p) {
    try {
      const res = await fetch(`/api/partners/${encodeURIComponent(p.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
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
    } catch {
      showToast("Erreur enregistrement partenaire (migration SQL appliquée ?).", "error");
    }
  }

  if (loading) {
    return <p className="text-slate-600">Chargement des règles…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-extrabold text-slate-800">Frais fixes</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-bold text-slate-700">
            Ramassage Abidjan (FCFA)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={fees.ramassage}
              onChange={(e) =>
                setFees({ ...fees, ramassage: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Assurance par colis (FCFA)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={fees.insurance}
              onChange={(e) =>
                setFees({ ...fees, insurance: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Dépôt agence (FCFA)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2"
              value={fees.depot}
              onChange={(e) =>
                setFees({ ...fees, depot: Number(e.target.value) || 0 })
              }
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Dépôt : 0 = gratuit. Assurance : forfait par colis ; la valeur déclarée
          côté client sert à la couverture indiquée dans vos CGV.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-slate-800">
            Destinations (prix transport)
          </h3>
          <Button
            type="button"
            variant="outline"
            className="text-xs"
            onClick={() =>
              setDestinations((d) => [
                ...d,
                {
                  id: `ville-${Date.now()}`,
                  name: "Nouvelle ville",
                  price: 0,
                  active: true,
                  sort_order: d.length + 1,
                },
              ])
            }
          >
            + Destination
          </Button>
        </div>
        <div className="space-y-3">
          {destinations.map((d, idx) => (
            <div
              key={d.id}
              className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <label className="text-xs font-bold text-slate-500">
                ID (slug)
                <input
                  className="mt-1 block w-28 rounded border border-slate-200 p-1 text-sm"
                  value={d.id}
                  onChange={(e) => {
                    const next = [...destinations];
                    next[idx] = { ...d, id: e.target.value };
                    setDestinations(next);
                  }}
                />
              </label>
              <label className="min-w-[120px] flex-1 text-xs font-bold text-slate-500">
                Nom affiché
                <input
                  className="mt-1 block w-full rounded border border-slate-200 p-1 text-sm"
                  value={d.name}
                  onChange={(e) => {
                    const next = [...destinations];
                    next[idx] = { ...d, name: e.target.value };
                    setDestinations(next);
                  }}
                />
              </label>
              <label className="text-xs font-bold text-slate-500">
                Prix FCFA
                <input
                  type="number"
                  className="mt-1 block w-24 rounded border border-slate-200 p-1 text-sm"
                  value={d.price}
                  onChange={(e) => {
                    const next = [...destinations];
                    next[idx] = { ...d, price: Number(e.target.value) || 0 };
                    setDestinations(next);
                  }}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={d.active !== false}
                  onChange={(e) => {
                    const next = [...destinations];
                    next[idx] = { ...d, active: e.target.checked };
                    setDestinations(next);
                  }}
                />
                Actif
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button type="button" disabled={saving} onClick={saveRules}>
        {saving ? "Enregistrement…" : "Enregistrer les règles tarifaires"}
      </Button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-extrabold text-slate-800">
          Partenaires — conditions & contacts
        </h3>
        <p className="mb-4 text-sm text-slate-600">
          WhatsApp, adresse et conditions pour limiter les incompréhensions en gare.
        </p>
        <div className="space-y-4">
          {partners.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-bold text-blue-900">{p.id}</span>
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
    </div>
  );
}
