import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { queryRecords, isInsforgeConfigured } from "@/lib/insforge";

function monthKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request) {
  const denied = requireAdmin(request, { permission: "dashboard" });
  if (denied) return denied;
  if (!isInsforgeConfigured()) {
    return NextResponse.json({ error: "Insforge non configuré" }, { status: 503 });
  }
  try {
    const packages = (await queryRecords("packages", { limit: "500", order: "created_at.desc" })) || [];
    const partners =
      (await queryRecords("partners", { limit: "200", order: "name.asc" })) || [];
    const partnerById = Object.fromEntries(partners.map((p) => [p.id, p]));

    const byMonth = new Map();
    const byPartner = new Map();

    for (const p of packages) {
      const created = p.created_at ? new Date(p.created_at) : null;
      if (created && !Number.isNaN(created.getTime())) {
        const mk = monthKey(created);
        if (!byMonth.has(mk)) byMonth.set(mk, { month: mk, count: 0, revenue: 0 });
        const m = byMonth.get(mk);
        m.count += 1;
        m.revenue += Number(p.price) || 0;
      }

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
      b.revenue += Number(p.price) || 0;
      if (p.receiver_phone) b.distinctReceivers.add(String(p.receiver_phone));
      if (p.sender_phone) b.distinctSenders.add(String(p.sender_phone));
    }

    const monthsSorted = [...byMonth.values()].sort((a, b) => {
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

    return NextResponse.json({
      byMonth: last6,
      byPartner: partnerRows,
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
