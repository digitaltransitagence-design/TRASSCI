import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { queryRecords, isInsforgeConfigured } from "@/lib/insforge";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
}

function monthKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}`;
}

/** Semaine ISO (année + numéro) */
function isoWeekKey(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((x - yearStart) / 86400000 + 1) / 7);
  return `${x.getUTCFullYear()}-S${pad2(weekNo)}`;
}

function quarterKey(d) {
  const x = new Date(d);
  const q = Math.floor(x.getMonth() / 3) + 1;
  return `${x.getFullYear()}-T${q}`;
}

function addAgg(map, key, getLabel, price) {
  if (!map.has(key)) {
    map.set(key, { key, label: getLabel(key), count: 0, revenue: 0 });
  }
  const o = map.get(key);
  o.count += 1;
  o.revenue += Number(price) || 0;
}

export async function GET(request) {
  const denied = requireAdmin(request, { permission: "dashboard" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  try {
    const packages =
      (await queryRecords("packages", { limit: "1500", order: "created_at.desc" })) || [];
    const partners =
      (await queryRecords("partners", { limit: "200", order: "name.asc" })) || [];
    const partnerById = Object.fromEntries(partners.map((p) => [p.id, p]));

    const dailyAgg = new Map();
    const weeklyAgg = new Map();
    const monthlyAgg = new Map();
    const quarterlyAgg = new Map();
    const yearlyAgg = new Map();
    const byMonthLegacy = new Map();
    const byPartner = new Map();
    const byStatus = new Map();

    const labelDay = (key) => {
      const [y, m, da] = key.split("-").map(Number);
      const dt = new Date(y, m - 1, da);
      return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    };
    const labelWeek = (key) => {
      const [y, s] = key.split("-S");
      return `S${s} ${y}`;
    };
    const labelMonth = (key) => {
      const [y, m] = key.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
    };
    const labelQuarter = (key) => {
      const [y, t] = key.split("-T");
      return `T${t} ${y}`;
    };

    for (const p of packages) {
      const created = p.created_at ? new Date(p.created_at) : null;
      if (!created || Number.isNaN(created.getTime())) continue;
      const price = Number(p.price) || 0;

      const dk = dayKey(created);
      addAgg(dailyAgg, dk, labelDay, price);

      const wk = isoWeekKey(created);
      addAgg(weeklyAgg, wk, labelWeek, price);

      const mk = monthKey(created);
      addAgg(monthlyAgg, mk, () => labelMonth(mk), price);

      const qk = quarterKey(created);
      addAgg(quarterlyAgg, qk, () => labelQuarter(qk), price);

      const yk = String(created.getFullYear());
      addAgg(yearlyAgg, yk, (k) => k, price);

      if (!byMonthLegacy.has(mk)) {
        byMonthLegacy.set(mk, { month: mk, count: 0, revenue: 0 });
      }
      const mm = byMonthLegacy.get(mk);
      mm.count += 1;
      mm.revenue += price;

      const st = p.status || "UNKNOWN";
      if (!byStatus.has(st)) byStatus.set(st, { status: st, count: 0 });
      byStatus.get(st).count += 1;

      const pid = p.partner_id || "_none";
      if (!byPartner.has(pid)) {
        byPartner.set(pid, {
          partnerId: pid === "_none" ? null : pid,
          name: pid === "_none" ? "(Sans gare)" : partnerById[pid]?.name || pid,
          count: 0,
          revenue: 0,
          distinctReceivers: new Set(),
          distinctSenders: new Set(),
        });
      }
      const b = byPartner.get(pid);
      b.count += 1;
      b.revenue += price;
      if (p.receiver_phone) b.distinctReceivers.add(String(p.receiver_phone));
      if (p.sender_phone) b.distinctSenders.add(String(p.sender_phone));
    }

    const today = new Date();
    const last90Days = [];
    for (let i = 89; i >= 0; i--) {
      const dd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const k = dayKey(dd);
      const existing = dailyAgg.get(k);
      last90Days.push({
        key: k,
        label: dd.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        count: existing?.count ?? 0,
        revenue: existing?.revenue ?? 0,
      });
    }

    const weeklySorted = [...weeklyAgg.values()].sort((a, b) => a.key.localeCompare(b.key));
    const last26Weeks = weeklySorted.slice(-26);

    const monthlySorted = [...monthlyAgg.values()].sort((a, b) => a.key.localeCompare(b.key));
    const last18Months = monthlySorted.slice(-18);

    const quarterlySorted = [...quarterlyAgg.values()].sort((a, b) =>
      a.key.localeCompare(b.key)
    );

    const yearlySorted = [...yearlyAgg.values()].sort((a, b) => a.key.localeCompare(b.key));

    const monthsSorted = [...byMonthLegacy.values()].sort((a, b) => {
      const [ya, ma] = a.month.split("-").map(Number);
      const [yb, mb] = b.month.split("-").map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });
    const last6 = monthsSorted.slice(-6);

    const partnerRows = [...byPartner.values()]
      .map((row) => ({
        partnerId: row.partnerId,
        name: row.name,
        count: row.count,
        revenue: row.revenue,
        destinatairesDistincts: row.distinctReceivers.size,
        expediteursDistincts: row.distinctSenders.size,
      }))
      .sort((a, b) => b.count - a.count);

    const totalSenders = new Set(
      packages.map((p) => p.sender_phone).filter(Boolean).map(String)
    ).size;

    const statusBreakdown = [...byStatus.values()].sort((a, b) => b.count - a.count);

    return NextResponse.json({
      byMonth: last6,
      series: {
        day: last90Days,
        week: last26Weeks,
        month: last18Months,
        quarter: quarterlySorted,
        year: yearlySorted,
      },
      byPartner: partnerRows,
      statusBreakdown,
      totalPackages: packages.length,
      totalRevenue: packages.reduce((s, p) => s + (Number(p.price) || 0), 0),
      expediteursDistinctsTotal: totalSenders,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Erreur" },
      { status: 500 }
    );
  }
}
