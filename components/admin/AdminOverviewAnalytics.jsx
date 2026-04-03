"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import { TrendingUp, Building2, Users } from "lucide-react";

export default function AdminOverviewAnalytics() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/analytics");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur");
      }
      setData(await res.json());
      setErr(null);
    } catch (e) {
      setErr(e.message || "Erreur");
      setData(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (err) {
    return (
      <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Analytics : {err}
      </div>
    );
  }

  if (!data) {
    return <p className="mb-8 text-sm text-slate-500">Chargement des indicateurs détaillés…</p>;
  }

  const maxMonth = Math.max(...data.byMonth.map((m) => m.count), 1);

  return (
    <div className="mb-10 space-y-8">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
          <TrendingUp className="h-6 w-6 text-orange-600" />
          Évolution des envois (6 derniers mois avec activité)
        </h3>
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {data.byMonth.length === 0 ? (
            <p className="text-sm text-slate-500">Pas encore assez de données.</p>
          ) : (
            data.byMonth.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full min-w-[40px] max-w-[72px] rounded-t-lg bg-orange-500 transition-all"
                  style={{ height: `${Math.max(8, (m.count / maxMonth) * 120)}px` }}
                  title={`${m.count} colis`}
                />
                <span className="text-[10px] font-bold text-slate-600">{m.month}</span>
                <span className="text-xs text-slate-500">{m.count} colis</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
          <Building2 className="h-6 w-6 text-emerald-600" />
          Volume & CA par partenaire (gare)
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                <th className="px-4 py-3">Partenaire</th>
                <th className="px-4 py-3">Colis</th>
                <th className="px-4 py-3">CA (FCFA)</th>
                <th className="px-4 py-3">Destinataires (distincts)</th>
                <th className="px-4 py-3">Expéditeurs (distincts)</th>
              </tr>
            </thead>
            <tbody>
              {data.byPartner.map((row) => (
                <tr key={row.partnerId || "none"} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-4 py-3">{row.count}</td>
                  <td className="px-4 py-3">{row.revenue.toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-3">{row.destinatairesDistincts}</td>
                  <td className="px-4 py-3">{row.expediteursDistincts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
        <h3 className="mb-2 flex items-center gap-2 font-bold text-blue-950">
          <Users className="h-5 w-5" />
          Base expéditeurs (indicateur clientèle)
        </h3>
        <p className="text-sm text-blue-900/90">
          <strong>{data.expediteursDistinctsTotal}</strong> numéros expéditeurs distincts sur les{" "}
          {data.totalPackages} colis chargés (échantillon max 500 — évolution à suivre dans le temps).
        </p>
      </div>
    </div>
  );
}
