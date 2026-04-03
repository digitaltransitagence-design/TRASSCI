"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Package } from "lucide-react";
import Button from "@/components/ui/Button";

const STORAGE_KEY = "trass_admin_secret";

export default function AdminLoginForm() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [openMode, setOpenMode] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await fetch("/api/admin/session", { cache: "no-store" }).then((r) =>
          r.json()
        );
        if (cancelled) return;
        if (!s.adminSecretRequired) {
          setOpenMode(true);
          return;
        }
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const v = await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret: stored }),
          });
          if (v.ok) {
            router.replace("/admin");
            return;
          }
          sessionStorage.removeItem(STORAGE_KEY);
        }
        setOpenMode(false);
      } catch {
        if (!cancelled) setOpenMode(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleOpenEnter() {
    setLoading(true);
    router.replace("/admin");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Accès refusé");
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, secret.trim());
      router.replace("/admin");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  if (openMode === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        Chargement…
      </div>
    );
  }

  if (openMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Portail Trass CI</h1>
          <p className="mt-2 max-w-md text-sm text-slate-400">
            Aucun code admin n’est configuré sur ce serveur (développement). L’espace
            client public reste sur <Link href="/client" className="text-orange-400 underline">/client</Link>.
          </p>
        </div>
        <Button
          type="button"
          className="px-10 py-4 text-lg"
          onClick={handleOpenEnter}
          disabled={loading}
        >
          Entrer dans l’administration
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-800/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Administration Trass CI</h1>
          <p className="mt-2 text-sm text-slate-400">
            Espace séparé du site client. Saisissez le code défini dans{" "}
            <code className="rounded bg-slate-900 px-1 text-orange-300">ADMIN_SECRET</code>{" "}
            (Vercel / serveur).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-bold text-slate-300">
            Code administrateur
            <input
              type="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
              placeholder="••••••••"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          <Button type="submit" className="w-full py-4 text-base" disabled={loading}>
            {loading ? "Connexion…" : "Connexion"}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          <Link href="/" className="text-slate-400 hover:text-white">
            ← Site public
          </Link>
          <span className="mx-2">·</span>
          <Link href="/client" className="text-slate-400 hover:text-white">
            Espace client (expéditeurs)
          </Link>
        </p>
      </div>
    </div>
  );
}
