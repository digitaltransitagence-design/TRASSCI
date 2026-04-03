"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

function adminHeaders() {
  if (typeof window === "undefined") return {};
  const s = sessionStorage.getItem("trass_admin_secret");
  return s ? { "x-admin-secret": s } : {};
}

export default function PartnersAdminPanel() {
  const { showToast } = useToast();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminSecretInput, setAdminSecretInput] = useState("");
  const [editingPartner, setEditingPartner] = useState(null);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners", { headers: adminHeaders() });
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
    try {
      setAdminSecretInput(sessionStorage.getItem("trass_admin_secret") || "");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  function saveSecret() {
    sessionStorage.setItem("trass_admin_secret", adminSecretInput.trim());
    showToast("Code enregistré pour cette session.", "success");
    loadPartners();
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
      showToast("Erreur enregistrement (migration SQL appliquée ?).", "error");
    }
  }

  if (loading) {
    return <p className="text-slate-600">Chargement des partenaires…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Code admin :</strong> requis si{" "}
        <code className="rounded bg-white px-1">ADMIN_SECRET</code> est défini sur le serveur.
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="password"
            className="min-w-[200px] flex-1 rounded-lg border border-amber-300 px-3 py-2"
            placeholder="Code secret admin"
            value={adminSecretInput}
            onChange={(e) => setAdminSecretInput(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={saveSecret}>
            Mémoriser
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-extrabold text-slate-800">Partenaires</h3>
        <p className="mb-6 text-sm text-slate-600">
          Gares, lignes, WhatsApp, adresses et conditions affichées côté client.
        </p>
        <div className="space-y-4">
          {partners.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-bold text-blue-900">{p.id}</span>
                <span className="text-sm font-medium text-slate-700">{p.name}</span>
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
