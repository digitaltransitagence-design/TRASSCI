"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Package } from "lucide-react";
import Button from "@/components/ui/Button";
import { adminFetch } from "@/components/admin/adminFetch";

export default function AdminLoginForm() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrap, setBootstrap] = useState({
    email: "",
    password: "",
    displayName: "",
    teamName: "Siège",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await adminFetch("/api/admin/me", { cache: "no-store" });
        if (me.ok) {
          router.replace("/admin");
          return;
        }
        const s = await fetch("/api/admin/session", { cache: "no-store" }).then((r) =>
          r.json()
        );
        if (!cancelled) setSessionInfo(s);
      } catch {
        if (!cancelled) setSessionInfo({ adminSecretRequired: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleOpenEnter() {
    setLoading(true);
    try {
      await adminFetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      router.replace("/admin");
    } catch {
      setError("Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitSecret(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Accès refusé");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitEmail(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Accès refusé");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function handleBootstrap(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: secret.trim(),
          bootstrap: {
            email: bootstrap.email.trim().toLowerCase(),
            password: bootstrap.password,
            displayName: bootstrap.displayName.trim() || "Administrateur",
            teamName: bootstrap.teamName.trim() || "Siège",
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  if (!sessionInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        Chargement…
      </div>
    );
  }

  const openMode = !sessionInfo.adminSecretRequired;
  const hasUsers = sessionInfo.hasUserAccounts;
  const schemaReady = sessionInfo.adminSchemaReady;

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
            client public reste sur{" "}
            <Link href="/client" className="text-orange-400 underline">
              /client
            </Link>
            .
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

  if (hasUsers) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-800/80 p-8 shadow-2xl backdrop-blur">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Connexion équipe</h1>
            <p className="mt-2 text-sm text-slate-400">
              Compte attribué par le super administrateur (équipe & permissions).
            </p>
          </div>

          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <label className="block text-sm font-bold text-slate-300">
              E-mail
              <input
                type="email"
                autoComplete="username"
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-bold text-slate-300">
              Mot de passe
              <input
                type="password"
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </p>
        </div>
      </div>
    );
  }

  if (schemaReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-800/80 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Premier administrateur</h1>
            <p className="mt-2 text-sm text-slate-400">
              Saisissez le code <code className="text-orange-300">ADMIN_SECRET</code> du serveur,
              puis créez le compte super administrateur et l’équipe « Siège ».
            </p>
          </div>

          <form onSubmit={handleBootstrap} className="space-y-4">
            <label className="block text-sm font-bold text-slate-300">
              Code serveur (ADMIN_SECRET)
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-bold text-slate-300">
              E-mail du super admin
              <input
                type="email"
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                value={bootstrap.email}
                onChange={(e) => setBootstrap({ ...bootstrap, email: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm font-bold text-slate-300">
              Mot de passe (8 caractères min.)
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                value={bootstrap.password}
                onChange={(e) => setBootstrap({ ...bootstrap, password: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm font-bold text-slate-300">
              Nom affiché
              <input
                type="text"
                className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
                value={bootstrap.displayName}
                onChange={(e) => setBootstrap({ ...bootstrap, displayName: e.target.value })}
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">{error}</p>
            )}
            <Button type="submit" className="w-full py-4 text-base" disabled={loading}>
              {loading ? "Création…" : "Créer le compte et se connecter"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            <Link href="/" className="text-slate-400 hover:text-white">
              ← Site public
            </Link>
          </p>
        </div>
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
            Exécutez <code className="rounded bg-slate-900 px-1 text-orange-300">migration_v4_admin_rbac.sql</code> sur Insforge pour activer les comptes équipe. En attendant, utilisez le code{" "}
            <code className="rounded bg-slate-900 px-1 text-orange-300">ADMIN_SECRET</code>.
          </p>
        </div>

        <form onSubmit={handleSubmitSecret} className="space-y-4">
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
