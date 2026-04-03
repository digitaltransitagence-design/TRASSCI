"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { adminFetch } from "@/components/admin/adminFetch";
import {
  TrendingUp,
  Building2,
  Users,
  PieChart as PieIcon,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PERIODS = [
  { id: "day", label: "90 jours (jour)" },
  { id: "week", label: "Semaines" },
  { id: "month", label: "Mois" },
  { id: "quarter", label: "Trimestres" },
  { id: "year", label: "Années" },
];

const STATUS_COLORS = [
  "#f97316",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#f59e0b",
  "#22c55e",
  "#94a3b8",
];

const CHART_COLORS = {
  line: "#ea580c",
  area: "#fb923c",
  revenue: "#059669",
};

export default function AdminOverviewAnalytics() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [period, setPeriod] = useState("month");

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

  const chartData = useMemo(() => {
    if (!data?.series) return [];
    const s = data.series;
    switch (period) {
      case "day":
        return s.day || [];
      case "week":
        return s.week || [];
      case "month":
        return s.month || [];
      case "quarter":
        return s.quarter || [];
      case "year":
        return s.year || [];
      default:
        return s.month || [];
    }
  }, [data, period]);

  const pieData = useMemo(() => {
    if (!data?.statusBreakdown?.length) return [];
    return data.statusBreakdown.map((x) => ({
      name: x.status,
      value: x.count,
    }));
  }, [data]);

  const partnerBarData = useMemo(() => {
    if (!data?.byPartner?.length) return [];
    return data.byPartner.slice(0, 8).map((p) => ({
      name: p.name.length > 28 ? `${p.name.slice(0, 26)}…` : p.name,
      colis: p.count,
      ca: p.revenue,
    }));
  }, [data]);

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

  const maxMonth = Math.max(...(data.byMonth || []).map((m) => m.count), 1);

  return (
    <div className="mb-10 space-y-10">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <Activity className="h-6 w-6 text-orange-600" />
            Suivi par période — colis & CA
          </h3>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  period === p.id
                    ? "bg-orange-600 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          Courbes : nombre de colis (axe gauche) et chiffre d&apos;affaires cumulé par période (axe
          droit, FCFA).
        </p>
        <div className="h-[320px] w-full min-w-0">
          {chartData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">
              Pas assez de données pour cette période.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={period === "day" ? 13 : 0}
                  angle={period === "day" ? -45 : 0}
                  textAnchor={period === "day" ? "end" : "middle"}
                  height={period === "day" ? 60 : 30}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                  label={{ value: "Colis", angle: -90, position: "insideLeft", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1000)}k`
                  }
                  label={{ value: "CA (FCFA)", angle: 90, position: "insideRight", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  formatter={(value, name) => [
                    name === "revenue" ? `${Number(value).toLocaleString("fr-FR")} FCFA` : value,
                    name === "count" ? "Colis" : "CA",
                  ]}
                  labelFormatter={(l) => `Période : ${l}`}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  name="Colis"
                  fill={CHART_COLORS.area}
                  fillOpacity={0.25}
                  stroke={CHART_COLORS.line}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  name="CA (FCFA)"
                  stroke={CHART_COLORS.revenue}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-800">
            <PieIcon className="h-5 w-5 text-violet-600" />
            Répartition par statut
          </h3>
          <p className="mb-4 text-xs text-slate-500">Sur l&apos;échantillon de colis chargé.</p>
          <div className="h-[260px]">
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune donnée.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} colis`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-800">
            <Building2 className="h-5 w-5 text-emerald-600" />
            Top partenaires (volume)
          </h3>
          <p className="mb-4 text-xs text-slate-500">8 premiers par nombre de colis.</p>
          <div className="h-[260px]">
            {partnerBarData.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune donnée.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={partnerBarData}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip />
                  <Bar dataKey="colis" name="Colis" fill="#ea580c" radius={[0, 4, 4, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-slate-800">
          <TrendingUp className="h-6 w-6 text-orange-600" />
          Aperçu rapide (6 derniers mois)
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
          Détail volume & CA par partenaire
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
          {data.totalPackages} colis chargés (échantillon max 1500).
        </p>
      </div>
    </div>
  );
}
