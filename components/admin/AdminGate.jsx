"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/components/admin/adminFetch";

/**
 * Vérifie la session cookie (/api/admin/me) ou mode ouvert sans ADMIN_SECRET.
 */
export default function AdminGate({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const me = await adminFetch("/api/admin/me", { cache: "no-store" });
        if (me.ok) {
          if (!cancelled) setStatus("ok");
          return;
        }

        const s = await fetch("/api/admin/session", { cache: "no-store" }).then((r) =>
          r.json()
        );
        if (!s.adminSecretRequired) {
          await adminFetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const me2 = await adminFetch("/api/admin/me", { cache: "no-store" });
          if (me2.ok) {
            if (!cancelled) setStatus("ok");
            return;
          }
        }

        if (!cancelled) router.replace("/admin/login");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <p className="text-sm font-medium text-slate-400">Vérification accès…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-900 px-6 text-center text-white">
        <p className="text-slate-300">Impossible de vérifier l’accès.</p>
        <button
          type="button"
          className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white"
          onClick={() => router.push("/admin/login")}
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  return children;
}
