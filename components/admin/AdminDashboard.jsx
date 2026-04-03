"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Truck,
  Check,
  Bike,
  Activity,
  Building2,
  BarChart3,
  Sparkles,
  AlertTriangle,
  Settings,
  LayoutDashboard,
  Users,
  MessageSquare,
  ListChecks,
  CalendarDays,
  LogOut,
  Shield,
} from "lucide-react";
import Button from "@/components/ui/Button";
import RulesPanel from "@/components/admin/RulesPanel";
import PartnersAdminPanel from "@/components/admin/PartnersAdminPanel";
import MessagesPanel from "@/components/admin/MessagesPanel";
import DeliveryStatusPanel from "@/components/admin/DeliveryStatusPanel";
import ShippingCalendarPanel from "@/components/admin/ShippingCalendarPanel";
import CoursiersAdminPanel from "@/components/admin/CoursiersAdminPanel";
import AdminAccessPanel from "@/components/admin/AdminAccessPanel";
import AdminOverviewAnalytics from "@/components/admin/AdminOverviewAnalytics";
import { adminFetch } from "@/components/admin/adminFetch";
import { TAB_PERMISSION } from "@/lib/admin-permissions";
import { useToast } from "@/components/providers/ToastProvider";

const STORAGE_ROLE = "trass_admin_role";
const DEMO_AGENT_PARTNER = "P-SBTA";

const TAB_TITLES = {
  dispatch: "Dispatch coursiers",
  hub: "Centre de tri",
  rules: "Règles & tarifs",
  ai_dashboard: "Tableau IA",
  admin_overview: "Administration — vue d’ensemble",
  partners_admin: "Partenaires",
  coursiers_admin: "Coursiers",
  messages: "Messages & alertes",
  delivery_status: "Statut de livraison",
  calendar: "Calendrier des envois",
  access: "Équipes & accès",
  gare_ops: "Embarquement",
  gare_delivery: "Remise client",
};

function canAccessTab(me, role, tabKey) {
  if (role === "AGENT_GARE") return tabKey === "gare_ops" || tabKey === "gare_delivery";
  if (role !== "SUPER_ADMIN") return false;
  if (tabKey === "access") {
    if (me == null) return false;
    return Boolean(me.isSuperAdmin);
  }
  if (me == null || me.openMode) return true;
  if (me.isSuperAdmin) return true;
  const need = TAB_PERMISSION[tabKey];
  if (!need) return true;
  return (me.permissions || []).includes(need);
}

async function patchPackage(id, body) {
  const res = await adminFetch(`/api/packages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Erreur");
  }
  return res.json();
}

export default function AdminDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [role, setRole] = useState("SUPER_ADMIN");
  const [tab, setTab] = useState("dispatch");
  const [packages, setPackages] = useState([]);
  const [partners, setPartners] = useState([]);
  const [coursiers, setCoursiers] = useState([]);
  const [apiDown, setApiDown] = useState(false);
  /** Erreur API autre que 503 (ex. table absente, 401 Insforge) */
  const [loadError, setLoadError] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [trafficById, setTrafficById] = useState({});
  const [loadingTraffic, setLoadingTraffic] = useState({});
  /** Session serveur (/api/admin/me) — permissions équipe */
  const [me, setMe] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [pr, pa, co, meRes] = await Promise.all([
        fetch("/api/packages", { cache: "no-store" }),
        fetch("/api/partners", { cache: "no-store" }),
        fetch("/api/coursiers", { cache: "no-store" }),
        adminFetch("/api/admin/me"),
      ]);
      if (meRes.ok) {
        setMe(await meRes.json());
      }
      if (pr.status === 503) {
        setApiDown(true);
        setLoadError(null);
        return;
      }
      setApiDown(false);
      if (!pr.ok) {
        const err = await pr.json().catch(() => ({}));
        setLoadError(err.error || `Erreur colis (${pr.status})`);
        return;
      }
      setLoadError(null);
      const pj = await pr.json();
      setPackages(pj.packages || []);
      if (pa.ok) {
        const p = await pa.json();
        setPartners(p.partners || []);
      }
      if (co.ok) {
        const c = await co.json();
        setCoursiers(c.coursiers || []);
      }
    } catch {
      setLoadError("Réseau ou serveur injoignable.");
      showToast("Erreur chargement données.", "error");
    }
  }, [showToast]);

  useEffect(() => {
    try {
      const r = localStorage.getItem(STORAGE_ROLE);
      if (r === "SUPER_ADMIN" || r === "AGENT_GARE") setRole(r);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ROLE, role);
    } catch {
      /* ignore */
    }
    if (role === "AGENT_GARE") setTab("gare_ops");
    else setTab("dispatch");
  }, [role]);

  useEffect(() => {
    if (role !== "SUPER_ADMIN" || me == null) return;
    if (!canAccessTab(me, role, tab)) {
      const order = [
        "admin_overview",
        "dispatch",
        "hub",
        "rules",
        "partners_admin",
        "coursiers_admin",
        "messages",
        "delivery_status",
        "calendar",
        "ai_dashboard",
        "access",
      ];
      const next = order.find((k) => canAccessTab(me, role, k));
      if (next) setTab(next);
    }
  }, [me, role, tab]);

  const stats = {
    total: packages.length,
    revenue: packages.reduce((a, p) => a + (p.price || 0), 0),
    pending: packages.filter((p) => p.status === "PENDING").length,
    incidents: packages.filter((p) => p.issue).length,
    delivered: packages.filter((p) => p.status === "DELIVERED").length,
    inFlight: packages.filter((p) =>
      ["PICKING_UP", "AT_HUB", "AT_STATION", "IN_TRANSIT", "READY_FOR_PICKUP"].includes(p.status)
    ).length,
    partnersActive: partners.filter((x) => x.active).length,
    partnersTotal: partners.length,
    coursiersTotal: coursiers.length,
  };

  async function handleTrafficInsight(pkg) {
    const addr = pkg.pickup_address || "Abidjan";
    setLoadingTraffic((m) => ({ ...m, [pkg.id]: true }));
    try {
      const res = await fetch("/api/ai/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: addr,
          destination: pkg.destination,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setTrafficById((m) => ({ ...m, [pkg.id]: j.text }));
    } catch (e) {
      showToast(e.message || "IA indisponible", "error");
    } finally {
      setLoadingTraffic((m) => ({ ...m, [pkg.id]: false }));
    }
  }

  async function handleStrategicReport() {
    setLoadingReport(true);
    setAiReport(null);
    try {
      let pricingHint = "";
      try {
        const pr = await fetch("/api/pricing", { cache: "no-store" });
        if (pr.ok) {
          const p = await pr.json();
          pricingHint = `Barème actuel (indicatif) : ramassage ${p.fees?.ramassage} F, assurance ${p.fees?.insurance} F/col, dépôt ${p.fees?.depot} F. Destinations : ${(p.destinations || []).map((d) => `${d.name}:${d.price}`).join("; ")}.`;
        }
      } catch {
        /* ignore */
      }
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: stats.total,
          revenue: stats.revenue,
          incidents: stats.incidents,
          pricingHint,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      setAiReport(j.text);
      showToast("Rapport généré.", "success");
    } catch (e) {
      showToast(e.message || "Erreur IA", "error");
    } finally {
      setLoadingReport(false);
    }
  }

  async function assignCoursier(pkgId, coursierId) {
    try {
      await patchPackage(pkgId, {
        status: "PICKING_UP",
        coursier_id: coursierId,
        issue: null,
        author: "Admin Trass",
      });
      showToast("Coursier assigné.");
      refresh();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function confirmHub(pkgId) {
    try {
      await patchPackage(pkgId, {
        status: "AT_HUB",
        issue: null,
        author: "Coursier",
      });
      showToast("Colis au hub.");
      refresh();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function assignPartner(pkgId, partnerId) {
    try {
      await patchPackage(pkgId, {
        status: "AT_STATION",
        partner_id: partnerId,
        author: "Admin Trass",
      });
      showToast("Colis affecté à la gare.");
      refresh();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function reportIncident(pkgId) {
    const issue = window.prompt("Décrire l'incident :");
    if (!issue) return;
    try {
      await patchPackage(pkgId, {
        issue,
        appendHistory: false,
        author: "Agent",
      });
      showToast("Incident enregistré.", "error");
      refresh();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function embark(pkgId) {
    try {
      await patchPackage(pkgId, {
        status: "IN_TRANSIT",
        author: "Agent SBTA",
      });
      showToast("Embarquement validé.");
      refresh();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function arriveDestination(pkgId) {
    try {
      await patchPackage(pkgId, {
        status: "READY_FOR_PICKUP",
        author: "Agent SBTA",
      });
      showToast("Arrivée en gare.");
      refresh();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function deliver(pkgId, receiverPhone) {
    if (
      !window.confirm(
        `CNI vérifiée pour le numéro ${receiverPhone} ?`
      )
    )
      return;
    try {
      await patchPackage(pkgId, {
        status: "DELIVERED",
        issue: null,
        author: "Agent SBTA",
      });
      showToast("Colis livré.");
      refresh();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  const pickupPending = packages.filter(
    (p) => p.status === "PENDING" && p.delivery_mode === "ramassage"
  );
  const pickingUp = packages.filter((p) => p.status === "PICKING_UP");
  const hubRows = packages.filter(
    (p) =>
      p.status === "AT_HUB" ||
      (p.status === "PENDING" && p.delivery_mode === "depot")
  );
  const atStation = packages.filter(
    (p) =>
      p.partner_id === DEMO_AGENT_PARTNER && p.status === "AT_STATION"
  );
  const inTransit = packages.filter(
    (p) =>
      p.partner_id === DEMO_AGENT_PARTNER && p.status === "IN_TRANSIT"
  );
  const readyPickup = packages.filter(
    (p) =>
      p.partner_id === DEMO_AGENT_PARTNER && p.status === "READY_FOR_PICKUP"
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-72 shrink-0 flex-col bg-slate-900 text-white shadow-2xl">
        <div className="border-b border-slate-800 p-6">
          <div className="flex items-center gap-3 text-2xl font-extrabold">
            <span className="rounded-xl bg-orange-500 p-2">
              <Package className="h-6 w-6" />
            </span>
            TRASS<span className="text-orange-500">CI</span>
          </div>
          <div className="mt-4 flex rounded-lg bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setRole("SUPER_ADMIN")}
              className={`flex-1 rounded py-2 text-xs font-bold ${
                role === "SUPER_ADMIN"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400"
              }`}
            >
              Siège
            </button>
            <button
              type="button"
              onClick={() => setRole("AGENT_GARE")}
              className={`flex-1 rounded py-2 text-xs font-bold ${
                role === "AGENT_GARE"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400"
              }`}
            >
              Agent gare
            </button>
          </div>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {role === "SUPER_ADMIN" && (
            <>
              <p className="mb-2 ml-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Opérations
              </p>
              {canAccessTab(me, role, "dispatch") && (
                <button
                  type="button"
                  onClick={() => setTab("dispatch")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "dispatch"
                      ? "bg-blue-800 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Bike className="h-5 w-5" />
                  Dispatch coursiers
                </button>
              )}
              {canAccessTab(me, role, "hub") && (
                <button
                  type="button"
                  onClick={() => setTab("hub")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "hub"
                      ? "bg-blue-800 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Activity className="h-5 w-5" />
                  Centre de tri
                </button>
              )}
              {canAccessTab(me, role, "rules") && (
                <button
                  type="button"
                  onClick={() => setTab("rules")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "rules"
                      ? "bg-teal-700 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  Règles & tarifs
                </button>
              )}
              <p className="mb-2 ml-2 mt-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Administration
              </p>
              {canAccessTab(me, role, "admin_overview") && (
                <button
                  type="button"
                  onClick={() => setTab("admin_overview")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "admin_overview"
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Vue d’ensemble
                </button>
              )}
              {canAccessTab(me, role, "access") && (
                <button
                  type="button"
                  onClick={() => setTab("access")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "access"
                      ? "bg-slate-600 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  Équipes & accès
                </button>
              )}
              {canAccessTab(me, role, "partners_admin") && (
                <button
                  type="button"
                  onClick={() => setTab("partners_admin")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "partners_admin"
                      ? "bg-emerald-800 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Users className="h-5 w-5" />
                  Partenaires
                </button>
              )}
              {canAccessTab(me, role, "coursiers_admin") && (
                <button
                  type="button"
                  onClick={() => setTab("coursiers_admin")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "coursiers_admin"
                      ? "bg-violet-800 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Bike className="h-5 w-5" />
                  Coursiers
                </button>
              )}
              {canAccessTab(me, role, "messages") && (
                <button
                  type="button"
                  onClick={() => setTab("messages")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "messages"
                      ? "bg-cyan-800 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </button>
              )}
              {canAccessTab(me, role, "delivery_status") && (
                <button
                  type="button"
                  onClick={() => setTab("delivery_status")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "delivery_status"
                      ? "bg-amber-800 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <ListChecks className="h-5 w-5" />
                  Statut livraison
                </button>
              )}
              {canAccessTab(me, role, "calendar") && (
                <button
                  type="button"
                  onClick={() => setTab("calendar")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "calendar"
                      ? "bg-orange-800 text-white"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <CalendarDays className="h-5 w-5" />
                  Calendrier envois
                </button>
              )}
              <p className="mb-2 ml-2 mt-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                IA
              </p>
              {canAccessTab(me, role, "ai_dashboard") && (
                <button
                  type="button"
                  onClick={() => setTab("ai_dashboard")}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
                    tab === "ai_dashboard"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                      : "text-indigo-300 hover:bg-slate-800"
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  Tableau IA ✨
                </button>
              )}
            </>
          )}
          {role === "AGENT_GARE" && (
            <>
              <div className="mb-4 rounded-xl border border-purple-800 bg-purple-900/50 p-4 text-center">
                <Building2 className="mx-auto mb-2 h-8 w-8 text-purple-400" />
                <p className="text-sm font-bold">Gare SBTA (Adjamé)</p>
              </div>
              <button
                type="button"
                onClick={() => setTab("gare_ops")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium ${
                  tab === "gare_ops"
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Truck className="h-5 w-5" />
                Embarquement
              </button>
              <button
                type="button"
                onClick={() => setTab("gare_delivery")}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium ${
                  tab === "gare_delivery"
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Check className="h-5 w-5" />
                Remise client
              </button>
            </>
          )}
        </nav>
        <div className="space-y-3 border-t border-slate-800 p-4 text-center text-xs text-slate-500">
          <Link href="/" className="block text-blue-300 hover:underline">
            Site public
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await adminFetch("/api/admin/logout", { method: "POST" });
              } catch {
                /* ignore */
              }
              try {
                sessionStorage.removeItem("trass_admin_secret");
              } catch {
                /* ignore */
              }
              router.replace("/admin/login");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-slate-400 transition hover:bg-slate-800 hover:text-orange-400"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion admin
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
            {TAB_TITLES[tab] || tab.replace(/_/g, " ")}
          </h2>
          {role === "SUPER_ADMIN" && (
            <div className="flex flex-wrap gap-4">
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2">
                <span className="block text-xs font-bold uppercase text-red-500">
                  Incidents
                </span>
                <span className="font-bold text-red-700">{stats.incidents}</span>
              </div>
              <div className="rounded-lg bg-slate-100 px-4 py-2">
                <span className="block text-xs font-bold uppercase text-slate-500">
                  CA (total)
                </span>
                <span className="font-bold text-slate-800">
                  {stats.revenue} F
                </span>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {apiDown && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <strong className="block text-amber-950">Connexion Insforge (503)</strong>
              <p className="mt-2">
                Ce message <strong>n&apos;est pas résolu</strong> en exécutant seulement du SQL.
                Le <strong>serveur</strong> (ex. Vercel) doit avoir{" "}
                <code className="rounded bg-white px-1">INSFORGE_API_URL</code> et{" "}
                <code className="rounded bg-white px-1">INSFORGE_API_KEY</code> (clé{" "}
                <em>API Key</em> <code className="rounded bg-white px-1">ik_…</code>, pas la
                Anon Key JWT). Redéployez après modification des variables.
              </p>
              <p className="mt-2 text-xs text-amber-900/90">
                Les fichiers SQL ne servent qu&apos;à créer les tables dans Insforge une fois la
                connexion OK.
              </p>
            </div>
          )}

          {loadError && !apiDown && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950">
              <strong className="block">Erreur chargement données</strong>
              <p className="mt-2 font-mono text-xs break-words">{loadError}</p>
              <p className="mt-2 text-xs text-red-900/90">
                Si le message parle d&apos;une <strong>table</strong> ou <strong>relation</strong>{" "}
                manquante, exécutez dans Insforge :{" "}
                <code className="rounded bg-white px-1">sql/schema.sql</code> ou les migrations{" "}
                <code className="rounded bg-white px-1">migration_v2_rules.sql</code>,{" "}
                <code className="rounded bg-white px-1">migration_v3_features.sql</code>,{" "}
                <code className="rounded bg-white px-1">migration_v4_admin_rbac.sql</code>.
              </p>
            </div>
          )}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "rules") &&
            tab === "rules" && <RulesPanel />}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "admin_overview") &&
            tab === "admin_overview" && (
            <div className="mx-auto max-w-5xl animate-fade-in">
              <p className="mb-6 text-slate-600">
                Tableau général — chiffres colis, CA, file logistique et réseau partenaires /
                coursiers.
              </p>

              <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Chiffre d&apos;affaires (prix enregistrés)
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-700">
                    {stats.revenue.toLocaleString("fr-FR")}{" "}
                    <span className="text-base font-bold text-slate-600">FCFA</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Colis total
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    En logistique active
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-blue-900">{stats.inFlight}</p>
                  <p className="text-xs text-blue-800/80">hors livré / annulé</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    Livrés
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-900">{stats.delivered}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-orange-800">
                    En attente saisie
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-orange-900">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">
                    Incidents
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-red-800">{stats.incidents}</p>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800">
                    Partenaires actifs
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-violet-900">
                    {stats.partnersActive}
                    <span className="text-sm font-semibold text-violet-700">
                      {" "}
                      / {stats.partnersTotal}
                    </span>
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-800">
                    Coursiers
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-indigo-900">{stats.coursiersTotal}</p>
                </div>
              </div>

              <AdminOverviewAnalytics />

              <p className="mb-4 text-sm font-bold text-slate-700">Accès rapide aux modules</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    key: "partners_admin",
                    title: "Partenaires",
                    desc: "Gares, contacts, WhatsApp, conditions",
                    icon: Users,
                    color: "border-emerald-200 bg-emerald-50 text-emerald-900",
                  },
                  {
                    key: "coursiers_admin",
                    title: "Coursiers",
                    desc: "Ramassages Abidjan — équipe terrain",
                    icon: Bike,
                    color: "border-violet-200 bg-violet-50 text-violet-900",
                  },
                  {
                    key: "messages",
                    title: "Messages",
                    desc: "Notes internes et incidents colis",
                    icon: MessageSquare,
                    color: "border-cyan-200 bg-cyan-50 text-cyan-900",
                  },
                  {
                    key: "delivery_status",
                    title: "Statut de livraison",
                    desc: "Tous les colis et filtres par étape",
                    icon: ListChecks,
                    color: "border-amber-200 bg-amber-50 text-amber-900",
                  },
                  {
                    key: "calendar",
                    title: "Calendrier d’envois",
                    desc: "Volume par jour (date de création)",
                    icon: CalendarDays,
                    color: "border-orange-200 bg-orange-50 text-orange-900",
                  },
                  {
                    key: "rules",
                    title: "Règles & tarifs",
                    desc: "Frais fixes et destinations",
                    icon: Settings,
                    color: "border-teal-200 bg-teal-50 text-teal-900",
                  },
                  {
                    key: "ai_dashboard",
                    title: "Tableau IA",
                    desc: "Rapport stratégique Gemini",
                    icon: BarChart3,
                    color: "border-indigo-200 bg-indigo-50 text-indigo-900",
                  },
                ].map((card) => (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => setTab(card.key)}
                    className={`flex flex-col items-start rounded-2xl border-2 p-6 text-left shadow-sm transition hover:shadow-md ${card.color}`}
                  >
                    <card.icon className="mb-3 h-8 w-8 opacity-90" />
                    <span className="text-lg font-extrabold">{card.title}</span>
                    <span className="mt-1 text-sm opacity-90">{card.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "partners_admin") &&
            tab === "partners_admin" && (
              <PartnersAdminPanel onChanged={refresh} />
            )}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "coursiers_admin") &&
            tab === "coursiers_admin" && (
              <CoursiersAdminPanel onChanged={refresh} />
            )}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "messages") &&
            tab === "messages" && <MessagesPanel packages={packages} />}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "delivery_status") &&
            tab === "delivery_status" && (
              <DeliveryStatusPanel packages={packages} />
            )}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "calendar") &&
            tab === "calendar" && (
              <ShippingCalendarPanel
                packages={packages}
                partners={partners}
                coursiers={coursiers}
              />
            )}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "access") &&
            tab === "access" && <AdminAccessPanel />}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "ai_dashboard") &&
            tab === "ai_dashboard" && (
            <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
              <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-indigo-900 p-8 text-white shadow-xl md:flex-row md:items-center">
                <div className="relative z-10">
                  <h2 className="mb-2 flex items-center gap-3 text-3xl font-extrabold">
                    <Sparkles className="h-8 w-8" />
                    Directeur logistique IA
                  </h2>
                  <p className="max-w-xl text-indigo-200">
                    Analyse stratégique à partir des KPI actuels (colis, CA,
                    incidents).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="relative z-10 border-0 bg-white !text-indigo-900 hover:!bg-indigo-50"
                  disabled={loadingReport}
                  onClick={handleStrategicReport}
                >
                  {loadingReport ? "Génération…" : "Générer audit IA"}
                </Button>
                <BarChart3 className="pointer-events-none absolute -bottom-6 -right-6 h-48 w-48 text-indigo-800 opacity-40" />
              </div>
              {aiReport && (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h3 className="mb-6 border-b pb-4 text-lg font-bold text-slate-800">
                    Rapport (Gemini)
                  </h3>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
                    {aiReport}
                  </div>
                </div>
              )}
            </div>
          )}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "dispatch") &&
            tab === "dispatch" && (
            <div className="grid animate-fade-in gap-6 lg:grid-cols-2">
              <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex justify-between border-b border-slate-100 bg-slate-50 p-4 font-bold text-slate-700">
                  <span>Ramassages en attente</span>
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
                    {pickupPending.length}
                  </span>
                </div>
                <div className="max-h-[480px] space-y-4 overflow-y-auto p-4">
                  {pickupPending.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="relative rounded-xl border border-slate-200 p-4"
                    >
                      {pkg.issue && (
                        <span className="absolute right-2 top-2 flex h-3 w-3 animate-ping rounded-full bg-red-500" />
                      )}
                      <div className="mb-2 flex justify-between">
                        <span className="font-mono font-bold text-blue-900">
                          {pkg.id}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {pkg.destination}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {pkg.sender_name}
                      </p>
                      <p className="mb-3 text-xs text-slate-500">
                        {pkg.pickup_address || "Adresse non renseignée"}
                      </p>
                      {trafficById[pkg.id] && (
                        <p className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                          {trafficById[pkg.id]}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <select
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm font-bold"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value)
                              assignCoursier(pkg.id, e.target.value);
                          }}
                        >
                          <option value="">Assigner coursier…</option>
                          {coursiers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0 px-3 text-xs"
                          disabled={loadingTraffic[pkg.id]}
                          onClick={() => handleTrafficInsight(pkg)}
                        >
                          {loadingTraffic[pkg.id] ? "…" : "✨ Itinéraire"}
                        </Button>
                        <button
                          type="button"
                          onClick={() => reportIncident(pkg.id)}
                          className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-600"
                          aria-label="Incident"
                        >
                          <AlertTriangle className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {pickupPending.length === 0 && (
                    <p className="text-center text-sm text-slate-500">
                      Aucun ramassage en attente.
                    </p>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 p-4 font-bold text-blue-900">
                  <Bike className="h-5 w-5" />
                  En ramassage
                </div>
                <div className="space-y-4 p-4">
                  {pickingUp.map((pkg) => {
                    const c = coursiers.find((x) => x.id === pkg.coursier_id);
                    return (
                      <div
                        key={pkg.id}
                        className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/30 p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="mb-1 text-xs font-bold text-blue-500">
                              {c?.name || "Coursier"}
                            </p>
                            <p className="font-mono font-bold text-slate-800">
                              {pkg.id}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => reportIncident(pkg.id)}
                            className="text-red-500"
                            aria-label="Incident"
                          >
                            <AlertTriangle className="h-5 w-5" />
                          </button>
                        </div>
                        <Button
                          type="button"
                          className="w-full py-3 text-xs"
                          onClick={() => confirmHub(pkg.id)}
                        >
                          Confirmer retour hub
                        </Button>
                      </div>
                    );
                  })}
                  {pickingUp.length === 0 && (
                    <p className="text-center text-sm text-slate-500">
                      Aucun coursier en ramassage.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {role === "SUPER_ADMIN" &&
            canAccessTab(me, role, "hub") &&
            tab === "hub" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-fade-in">
              <div className="border-b border-slate-100 p-6">
                <h3 className="font-bold text-slate-800">Centre de tri</h3>
                <p className="text-sm text-slate-500">
                  Affectation aux gares partenaires.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-4">Colis</th>
                      <th className="p-4">Destination</th>
                      <th className="p-4">État</th>
                      <th className="p-4 text-right">Gare</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hubRows.map((pkg) => (
                      <tr
                        key={pkg.id}
                        className={pkg.issue ? "bg-red-50/50" : "hover:bg-slate-50"}
                      >
                        <td className="p-4">
                          <span className="block font-mono font-bold text-blue-900">
                            {pkg.id}
                          </span>
                          <span className="text-xs text-slate-500">
                            {pkg.nature}
                          </span>
                        </td>
                        <td className="p-4 font-bold">{pkg.destination}</td>
                        <td className="p-4">
                          {pkg.issue ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              {pkg.issue}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-green-600">
                              RAS
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => reportIncident(pkg.id)}
                              className="rounded border border-slate-200 p-2 text-slate-400 hover:text-red-500"
                              aria-label="Incident"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                            <select
                              className="max-w-[200px] rounded-lg border border-slate-300 p-2 text-xs font-bold"
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value)
                                  assignPartner(pkg.id, e.target.value);
                              }}
                            >
                              <option value="">Partenaire…</option>
                              {partners.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.route})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hubRows.length === 0 && (
                  <p className="p-8 text-center text-slate-500">
                    Aucun colis au hub.
                  </p>
                )}
              </div>
            </div>
          )}

          {role === "AGENT_GARE" && tab === "gare_ops" && (
            <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-extrabold text-slate-800">
                  Colis à embarquer (SBTA)
                </h3>
                <div className="space-y-4">
                  {atStation.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row"
                    >
                      <div>
                        <span className="block font-mono text-lg font-extrabold text-blue-900">
                          {pkg.id}
                        </span>
                        <span className="text-sm text-slate-600">
                          Vers <strong>{pkg.destination}</strong>
                        </span>
                      </div>
                      <div className="flex w-full gap-2 md:w-auto">
                        <button
                          type="button"
                          onClick={() => reportIncident(pkg.id)}
                          className="rounded-xl border border-slate-200 bg-white p-2 text-red-500"
                        >
                          <AlertTriangle className="h-5 w-5" />
                        </button>
                        <Button
                          type="button"
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                          onClick={() => embark(pkg.id)}
                        >
                          Valider départ
                        </Button>
                      </div>
                    </div>
                  ))}
                  {atStation.length === 0 && (
                    <p className="text-center text-slate-500">
                      Aucun colis à embarquer.
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-800 p-6 text-white">
                <h3 className="mb-4 text-sm font-bold uppercase text-slate-400">
                  Simulation arrivée destination
                </h3>
                <div className="flex flex-wrap gap-2">
                  {inTransit.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => arriveDestination(pkg.id)}
                      className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 font-mono text-sm"
                    >
                      Arrivée {pkg.id}
                    </button>
                  ))}
                  {inTransit.length === 0 && (
                    <span className="text-sm text-slate-400">
                      Aucun colis en transit.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {role === "AGENT_GARE" && tab === "gare_delivery" && (
            <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                <Check className="mx-auto mb-2 h-10 w-10 text-green-500" />
                <h3 className="text-xl font-extrabold text-green-900">
                  Remise en gare
                </h3>
                <p className="mt-1 text-sm text-green-800">
                  Vérifier la CNI du destinataire avant remise.
                </p>
              </div>
              {readyPickup.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col items-center gap-6 rounded-2xl border-2 border-slate-200 bg-white p-6 md:flex-row"
                >
                  <div className="flex-1 text-center md:text-left">
                    <span className="block font-mono text-3xl font-extrabold text-slate-800">
                      {pkg.id}
                    </span>
                    <div className="mt-4 inline-block rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="mb-1 text-xs font-bold uppercase text-slate-500">
                        Téléphone attendu
                      </p>
                      <p className="text-lg font-extrabold text-blue-900">
                        {pkg.receiver_phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 md:w-auto">
                    <Button
                      type="button"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => deliver(pkg.id, pkg.receiver_phone)}
                    >
                      <Check className="h-5 w-5" /> Remise CNI OK
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-red-200 text-red-600"
                      onClick={() => reportIncident(pkg.id)}
                    >
                      Client injoignable
                    </Button>
                  </div>
                </div>
              ))}
              {readyPickup.length === 0 && (
                <p className="text-center text-slate-500">
                  Aucun colis prêt au retrait.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
