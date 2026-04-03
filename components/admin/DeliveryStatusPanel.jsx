"use client";

import { useMemo, useState } from "react";
import { STATUS_FLOW } from "@/lib/constants";
import { Filter } from "lucide-react";

const STATUS_MAP = Object.fromEntries(STATUS_FLOW.map((s) => [s.id, s]));

export default function DeliveryStatusPanel({ packages = [] }) {
  const [filter, setFilter] = useState("ALL");

  const rows = useMemo(() => {
    let list = [...packages];
    list.sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });
    if (filter !== "ALL") list = list.filter((p) => p.status === filter);
    return list;
  }, [packages, filter]);

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Filter className="h-4 w-4" />
          Filtrer par statut
        </span>
        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">Tous ({packages.length})</option>
          {STATUS_FLOW.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} (
              {packages.filter((p) => p.status === s.id).length})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="p-4">Colis</th>
                <th className="p-4">Statut livraison</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Expéditeur</th>
                <th className="p-4">Créé le</th>
                <th className="p-4">Incident</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => {
                const st = STATUS_MAP[p.status] || STATUS_FLOW[0];
                return (
                  <tr key={p.id} className={p.issue ? "bg-red-50/40" : "hover:bg-slate-50"}>
                    <td className="p-4 font-mono font-bold text-blue-900">{p.id}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${st.color}`}
                      >
                        {st.label}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-500">{st.desc}</span>
                    </td>
                    <td className="p-4 font-medium">{p.destination}</td>
                    <td className="p-4 text-slate-700">{p.sender_name}</td>
                    <td className="p-4 text-slate-600">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString("fr-FR")
                        : "—"}
                    </td>
                    <td className="max-w-[200px] p-4 text-xs text-red-700">
                      {p.issue || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="p-8 text-center text-slate-500">Aucun colis pour ce filtre.</p>
        )}
      </div>
    </div>
  );
}
