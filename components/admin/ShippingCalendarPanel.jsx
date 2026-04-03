"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
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

export default function ShippingCalendarPanel({ packages = [] }) {
  const [cursor, setCursor] = useState(() => new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const byDay = useMemo(() => {
    const map = new Map();
    for (const p of packages) {
      if (!p.created_at) continue;
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return map;
  }, [packages]);

  const grid = useMemo(() => {
    const first = startOfMonth(cursor);
    const dim = daysInMonth(year, month);
    const jsDow = first.getDay();
    const mondayOffset = jsDow === 0 ? 6 : jsDow - 1;
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

  const monthLabel = cursor.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    setCursor(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCursor(new Date(year, month + 1, 1));
  }

  const [selectedKey, setSelectedKey] = useState(null);

  const selectedPkgs = selectedKey ? byDay.get(selectedKey) || [] : [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <CalendarDays className="h-6 w-6 text-orange-600" />
            Calendrier des envois
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              onClick={prevMonth}
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[180px] text-center text-sm font-bold capitalize text-slate-800">
              {monthLabel}
            </span>
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
              onClick={nextMonth}
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-slate-500">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((cell, ci) => {
                if (cell.type === "empty") {
                  return <div key={`e-${wi}-${ci}`} className="min-h-[72px] rounded-lg bg-slate-50/50" />;
                }
                const count = cell.pkgs.length;
                const active = selectedKey === cell.key;
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedKey(cell.key === selectedKey ? null : cell.key)}
                    className={`flex min-h-[72px] flex-col items-center justify-start rounded-lg border p-1 text-left transition ${
                      active
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-100 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-sm font-bold text-slate-800">{cell.day}</span>
                    {count > 0 && (
                      <span className="mt-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {count} envoi{count > 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Basé sur la date de création du colis en base. Cliquez un jour pour le détail.
        </p>
      </div>

      {selectedKey && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h4 className="mb-4 font-bold text-slate-800">
            {new Date(selectedKey + "T12:00:00").toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h4>
          <ul className="space-y-2">
            {selectedPkgs.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white bg-white p-3 text-sm shadow-sm"
              >
                <span className="font-mono font-bold text-blue-900">{p.id}</span>
                <span className="text-slate-600">{p.destination}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
