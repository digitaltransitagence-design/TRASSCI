"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "trass_admin_secret";

/**
 * Redirige vers /admin/login si ADMIN_SECRET est défini sur le serveur
 * et qu’aucun code n’est mémorisé (ou code invalide).
 */
export default function AdminGate({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const s = await fetch("/api/admin/session", { cache: "no-store" });
        const { adminSecretRequired } = await s.json();
        if (!adminSecretRequired) {
          if (!cancelled) setStatus("ok");
          return;
        }
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) {
          router.replace("/admin/login");
          return;
        }
        const v = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: stored }),
        });
        if (!v.ok) {
          sessionStorage.removeItem(STORAGE_KEY);
          router.replace("/admin/login");
          return;
        }
        if (!cancelled) setStatus("ok");
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
