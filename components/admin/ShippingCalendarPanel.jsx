"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  Clock,
  Filter,
  MapPin,
  Package,
  Truck,
  User,
  Building2,
  AlertCircle,
  Sparkles,
  X,
} from "lucide-react";
import { STATUS_FLOW, PACKAGE_STATUSES } from "@/lib/constants";
import Button from "@/components/ui/Button";

const WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const STATUS_DOT = {
  PENDING: "bg-slate-400",
  PICKING_UP: "bg-blue-500",
  AT_HUB: "bg-indigo-500",
  AT_STATION: "bg-purple-500",
  IN_TRANSIT: "bg-orange-500",
  READY_FOR_PICKUP: "bg-amber-500",
  DELIVERED: "bg-emerald-500",
};

const STATUS_MAP = Object.fromEntries(STATUS_FLOW.map((s) => [s.id, s]));

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Lundi = 0 … Dimanche = 6 */
function mondayIndex(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function padWeekStart(mondayBased) {
  const out = [];
  let i = 0;
  while (i < mondayBased.length) {
    out.push(mondayBased.slice(i, i + 7));
    i += 7;
  }
  return out;
}

function dayKeyFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parsePkgDate(raw) {
  if (!raw) return null;
  const t = new Date(raw);
  return Number.isNaN(t.getTime()) ? null : t;
}

function startOfWeekMonday(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const m = mondayIndex(x.getDay());
  x.setDate(x.getDate() - m);
  return x;
}

function addDays(d, n) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

function matchesSearch(p, q) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  const hay = [
    p.id,
    p.sender_name,
    p.sender_phone,
    p.receiver_name,
    p.receiver_phone,
    p.destination,
    p.issue,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export default function ShippingCalendarPanel({
  packages = [],
  partners = [],
  coursiers = [],
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState("month");
  const [dateField, setDateField] = useState("created_at");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modalKey, setModalKey] = useState(null);

  useEffect(() => {
    if (!modalKey) return;
    function onEsc(e) {
      if (e.key === "Escape") setModalKey(null);
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [modalKey]);

  const partnerById = useMemo(
    () => Object.fromEntries((partners || []).map((x) => [x.id, x])),
    [partners]
  );
  const coursierById = useMemo(
    () => Object.fromEntries((coursiers || []).map((x) => [x.id, x])),
    [coursiers]
  );

  const filtered = useMemo(() => {
    let list = [...packages];
    if (statusFilter !== "ALL") {
      list = list.filter((p) => p.status === statusFilter);
    }
    list = list.filter((p) => matchesSearch(p, search));
    return list;
  }, [packages, statusFilter, search]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const p of filtered) {
      const raw = dateField === "updated_at" ? p.updated_at : p.created_at;
      const d = parsePkgDate(raw);
      if (!d) continue;
      const key = dayKeyFromDate(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return map;
  }, [filtered, dateField]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const monthLabel = cursor.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const today = new Date();
  const todayKey = dayKeyFromDate(today);

  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const dim = daysInMonth(year, month);
    const mondayOffset = mondayIndex(first.getDay());
    const cells = [];
    for (let i = 0; i < mondayOffset; i++) cells.push({ type: "empty" });
    for (let day = 1; day <= dim; day++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        type: "day",
        day,
        key,
        pkgs: byDay.get(key) || [],
      });
    }
    while (cells.length % 7 !== 0) cells.push({ type: "empty" });
    return padWeekStart(cells);
  }, [cursor, year, month, byDay]);

  const weekStart = useMemo(() => startOfWeekMonday(cursor), [cursor]);
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      days.push({
        date: d,
        key: dayKeyFromDate(d),
        label: d.toLocaleDateString("fr-FR", { weekday: "short" }),
        dayNum: d.getDate(),
      });
    }
    return days;
  }, [weekStart]);

  const monthStats = useMemo(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    let inMonth = 0;
    let delivered = 0;
    let active = 0;
    let incidents = 0;
    for (const p of filtered) {
      const raw = dateField === "updated_at" ? p.updated_at : p.created_at;
      const d = parsePkgDate(raw);
      if (!d || d < start || d > end) continue;
      inMonth++;
      if (p.status === "DELIVERED") delivered++;
      else active++;
      if (p.issue) incidents++;
    }
    return { inMonth, delivered, active, incidents };
  }, [filtered, year, month, dateField]);

  const modalPkgs = modalKey ? byDay.get(modalKey) || [] : [];

  const goToday = useCallback(() => {
    const n = new Date();
    setCursor(n);
    setModalKey(dayKeyFromDate(n));
  }, []);

  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));
  const prevWeek = () => setCursor(addDays(weekStart, -7));
  const nextWeek = () => setCursor(addDays(weekStart, 7));

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* En-tête & contrôles */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-orange-50/40 to-amber-50/30 shadow-sm">
        <div className="border-b border-orange-100/80 bg-white/90 px-5 py-4 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-800">
                <CalendarDays className="h-6 w-6 text-orange-600" />
                Calendrier logistique — envois
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Visualisez la charge dans le temps : création ou dernière activité, filtres et
                détail par jour.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setView("month")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    view === "month"
                      ? "bg-orange-600 text-white shadow"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Mois
                </button>
                <button
                  type="button"
                  onClick={() => setView("week")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    view === "week"
                      ? "bg-orange-600 text-white shadow"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CalendarRange className="h-3.5 w-3.5" />
                  Semaine
                </button>
              </div>
              <Button type="button" variant="secondary" className="text-xs" onClick={goToday}>
                Aujourd&apos;hui
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Référence temporelle
              </span>
              <select
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800"
                value={dateField}
                onChange={(e) => {
                  setDateField(e.target.value);
                  setModalKey(null);
                }}
              >
                <option value="created_at">Date de création du colis</option>
                <option value="updated_at">Dernière activité (mise à jour)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                Statut
              </span>
              <select
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tous les statuts</option>
                {PACKAGE_STATUSES.map((id) => (
                  <option key={id} value={id}>
                    {STATUS_MAP[id]?.label || id}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] flex-1">
              <span className="mb-1 block text-xs font-bold text-slate-600">Recherche</span>
              <input
                type="search"
                placeholder="ID, destination, téléphone…"
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* KPI période (mois affiché en vue mois ; en vue semaine = mois du curseur) */}
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Ce mois (filtré)
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{monthStats.inMonth}</p>
            <p className="text-xs text-slate-500">colis sur la période</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Livrés
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-900">{monthStats.delivered}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
              En cours
            </p>
            <p className="mt-1 text-2xl font-extrabold text-blue-900">{monthStats.active}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
              Avec incident
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-950">{monthStats.incidents}</p>
          </div>
        </div>
      </div>

      {/* Navigation période */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50"
            onClick={view === "month" ? prevMonth : prevWeek}
            aria-label="Période précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[200px] text-center text-sm font-bold capitalize text-slate-800">
            {view === "month" ? monthLabel : `Semaine du ${weekStart.toLocaleDateString("fr-FR")}`}
          </span>
          <button
            type="button"
            className="rounded-lg border border-slate-200 p-2 transition hover:bg-slate-50"
            onClick={view === "month" ? nextMonth : nextWeek}
            aria-label="Période suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Légende : points = répartition des statuts sur la journée (échantillon visuel).
        </p>
      </div>

      {/* Vue mois */}
      {view === "month" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="mt-1 space-y-1">
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((cell, ci) => {
                  if (cell.type === "empty") {
                    return (
                      <div
                        key={`e-${wi}-${ci}`}
                        className="min-h-[88px] rounded-lg bg-slate-50/50 sm:min-h-[96px]"
                      />
                    );
                  }
                  const count = cell.pkgs.length;
                  const isOpen = modalKey === cell.key;
                  const isToday = cell.key === todayKey;
                  const statuses = [...new Set(cell.pkgs.map((p) => p.status))].slice(0, 5);

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setModalKey(cell.key)}
                      className={`flex min-h-[88px] flex-col items-stretch rounded-lg border p-1.5 text-left transition sm:min-h-[96px] ${
                        isOpen
                          ? "border-orange-500 bg-orange-50 ring-2 ring-orange-300/60"
                          : isToday
                            ? "border-blue-300 bg-blue-50/70 hover:border-blue-400"
                            : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-0.5">
                        <span
                          className={`text-sm font-bold ${isToday ? "text-blue-800" : "text-slate-800"}`}
                        >
                          {cell.day}
                        </span>
                        {isToday && (
                          <span className="rounded bg-blue-600 px-1 py-0 text-[8px] font-bold uppercase text-white">
                            now
                          </span>
                        )}
                      </div>
                      {count > 0 && (
                        <>
                          <div className="mt-1 flex flex-wrap gap-0.5">
                            {statuses.map((st) => (
                              <span
                                key={st}
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[st] || "bg-slate-400"}`}
                                title={STATUS_MAP[st]?.label || st}
                              />
                            ))}
                          </div>
                          <span className="mt-auto inline-flex items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-center text-[9px] font-bold text-white sm:text-[10px]">
                            {count} envoi{count > 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vue semaine */}
      {view === "week" && (
        <div className="grid gap-3 lg:grid-cols-7">
          {weekDays.map((wd) => {
            const pkgs = byDay.get(wd.key) || [];
            const isOpen = modalKey === wd.key;
            const isToday = wd.key === todayKey;
            return (
              <button
                key={wd.key}
                type="button"
                onClick={() => setModalKey(wd.key)}
                className={`flex min-h-[220px] flex-col rounded-2xl border p-3 text-left transition ${
                  isOpen
                    ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                    : isToday
                      ? "border-blue-300 bg-blue-50/50 hover:border-blue-400"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="mb-2 border-b border-slate-100 pb-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">{wd.label}</p>
                  <p className={`text-xl font-extrabold ${isToday ? "text-blue-800" : "text-slate-900"}`}>
                    {wd.dayNum}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
                  {pkgs.length === 0 ? (
                    <p className="text-[11px] text-slate-400">Aucun</p>
                  ) : (
                    pkgs.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className="truncate rounded-md border border-slate-100 bg-slate-50/80 px-1.5 py-1 text-[10px]"
                      >
                        <span className="font-mono font-bold text-blue-900">{p.id}</span>
                        <span
                          className={`ml-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${STATUS_DOT[p.status] || "bg-slate-400"}`}
                        />
                      </div>
                    ))
                  )}
                  {pkgs.length > 5 && (
                    <p className="text-[10px] font-semibold text-orange-600">+{pkgs.length - 5}</p>
                  )}
                </div>
                {pkgs.length > 0 && (
                  <p className="mt-2 text-center text-[10px] font-bold text-slate-600">
                    {pkgs.length} colis
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modale détail jour */}
      {modalKey && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-day-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalKey(null);
          }}
        >
          <div className="max-h-[min(90vh,720px)] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4">
              <div>
                <h4
                  id="calendar-day-title"
                  className="flex items-center gap-2 text-lg font-bold text-slate-900"
                >
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  {new Date(modalKey + "T12:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h4>
                <p className="mt-1 text-xs text-slate-600">
                  {modalPkgs.length} colis — référence :{" "}
                  {dateField === "updated_at" ? "dernière activité" : "création"}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                onClick={() => setModalKey(null)}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[min(70vh,600px)] overflow-y-auto p-5">
              {modalPkgs.length === 0 ? (
                <p className="text-center text-sm text-slate-500">Aucun colis ce jour (filtres).</p>
              ) : (
                <ul className="space-y-3">
                  {modalPkgs
                    .slice()
                    .sort((a, b) => {
                      const ta = parsePkgDate(
                        dateField === "updated_at" ? a.updated_at : a.created_at
                      );
                      const tb = parsePkgDate(
                        dateField === "updated_at" ? b.updated_at : b.created_at
                      );
                      return (tb?.getTime() || 0) - (ta?.getTime() || 0);
                    })
                    .map((p) => {
                      const st = STATUS_MAP[p.status];
                      const when = parsePkgDate(
                        dateField === "updated_at" ? p.updated_at : p.created_at
                      );
                      const partner = p.partner_id ? partnerById[p.partner_id] : null;
                      const coursier = p.coursier_id ? coursierById[p.coursier_id] : null;
                      return (
                        <li
                          key={p.id}
                          className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm shadow-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Package className="h-4 w-4 shrink-0 text-orange-600" />
                              <span className="font-mono font-bold text-blue-900">{p.id}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st?.color || "bg-slate-100 text-slate-700"}`}
                              >
                                {st?.label || p.status}
                              </span>
                            </div>
                            {when && (
                              <span className="text-xs text-slate-500">
                                {when.toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <p className="flex items-start gap-1.5 text-slate-700">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <span>{p.destination}</span>
                            </p>
                            <p className="flex items-start gap-1.5 text-slate-700">
                              <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              <span>
                                {p.receiver_name || "—"} · {p.receiver_phone}
                              </span>
                            </p>
                            <p className="flex items-start gap-1.5 text-slate-600 sm:col-span-2">
                              <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              Expéditeur : {p.sender_name} · {p.sender_phone}
                            </p>
                            {partner && (
                              <p className="flex items-start gap-1.5 text-slate-600">
                                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                Partenaire : {partner.name}
                              </p>
                            )}
                            {coursier && (
                              <p className="flex items-start gap-1.5 text-slate-600">
                                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                Coursier : {coursier.name}
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>
                              Prix : <strong className="text-slate-800">{p.price ?? "—"} FCFA</strong>
                            </span>
                            <span>Mode : {p.delivery_mode || "—"}</span>
                            {p.issue && (
                              <span className="flex items-center gap-1 text-amber-800">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {p.issue}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && packages.length > 0 && (
        <p className="text-center text-sm text-amber-800">
          Aucun colis ne correspond aux filtres — élargissez la recherche ou le statut.
        </p>
      )}
    </div>
  );
}
