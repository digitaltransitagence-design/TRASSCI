"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, Mail, Package, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";

const GUIDE_PREVIEW = [
  "Expéditeur : nom et téléphone joignables (WhatsApp de préférence).",
  "Destinataire : nom complet et numéro pour retrait en gare (CNI vérifiée).",
  "Destination : choisissez la ville d'arrivée dans la liste.",
  "Nature du colis : document, marchandise, électronique, etc. (impact assurance).",
  "Mode : ramassage à domicile ou dépôt en agence.",
  "Assurance : cochez si besoin et indiquez une valeur déclarée réaliste (FCFA).",
  "Adresse de ramassage : précise si vous choisissez le ramassage.",
  "Photo (optionnel) : lien vers une image du colis emballé.",
];

function safeNextPath(raw) {
  if (!raw || typeof raw !== "string") return "/client/envoi";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/client/envoi";
  return t;
}

export default function ClientLanding() {
  const searchParams = useSearchParams();
  const afterLogin = safeNextPath(searchParams.get("next"));
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [authStatusLoaded, setAuthStatusLoaded] = useState(false);
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [guideSending, setGuideSending] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  useEffect(() => {
    fetch("/api/client/auth-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setGoogleEnabled(!!d.google);
      })
      .catch(() => {
        setGoogleEnabled(false);
      })
      .finally(() => setAuthStatusLoaded(true));
  }, []);

  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    const messages = {
      TableClient:
        "Base « client » non prête — exécutez sql/migration_v5_client_auth.sql sur Insforge.",
      AccessDenied: "Connexion annulée.",
      OAuthSignin: "Erreur OAuth — vérifiez GOOGLE_CLIENT_ID / SECRET et l’URI de redirection Google.",
      OAuthCallback:
        "Erreur après Google — l’URI autorisée doit être : {votre-site}/api/auth/callback/google",
      OAuthCreateAccount: "Impossible de créer le compte.",
      Configuration: "Vérifiez NEXTAUTH_SECRET et NEXTAUTH_URL sur le serveur.",
    };
    showToast(messages[err] || `Erreur de connexion : ${err}`, "error");
  }, [searchParams, showToast]);

  const onGoogle = useCallback(async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: afterLogin });
    } finally {
      setLoading(false);
    }
  }, [afterLogin]);

  const onLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await signIn("credentials", {
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
          redirect: false,
        });
        if (res?.error) {
          showToast("E-mail ou mot de passe incorrect.", "error");
          return;
        }
        window.location.href = afterLogin;
      } finally {
        setLoading(false);
      }
    },
    [afterLogin, loginEmail, loginPassword, showToast]
  );

  const onRegister = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await fetch("/api/client/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: regEmail.trim().toLowerCase(),
            password: regPassword,
            name: regName.trim(),
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(j.error || "Inscription impossible.", "error");
          return;
        }
        showToast("Compte créé — connexion…", "success");
        const si = await signIn("credentials", {
          email: regEmail.trim().toLowerCase(),
          password: regPassword,
          redirect: false,
        });
        if (si?.error) {
          showToast("Compte créé. Connectez-vous manuellement.", "error");
          setTab("login");
          setLoginEmail(regEmail.trim().toLowerCase());
          return;
        }
        window.location.href = afterLogin;
      } finally {
        setLoading(false);
      }
    },
    [afterLogin, regEmail, regPassword, regName, showToast]
  );

  const sendGuideEmail = useCallback(async () => {
    setGuideSending(true);
    try {
      const res = await fetch("/api/client/guide-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(j.error || "Envoi impossible.", "error");
        return;
      }
      if (j.mode === "stub" && j.guide) {
        showToast(
          j.reason === "resend_sandbox" && j.message
            ? j.message
            : "Copiez le guide affiché ci-dessous (e-mail non configuré).",
          j.reason === "resend_sandbox" ? "error" : "success"
        );
      } else {
        showToast("Guide envoyé sur votre boîte e-mail.", "success");
      }
    } finally {
      setGuideSending(false);
    }
  }, [showToast]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-600">
        Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-10 text-center">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Espace expéditeur
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-950 sm:text-4xl">
          Bienvenue sur votre espace client
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Créez un compte en un clic avec Google, ou avec un e-mail et un mot de passe. Ensuite,
          accédez au formulaire d&apos;envoi et au suivi de vos colis.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        {session ? (
          <div className="space-y-6 text-center">
            <p className="text-slate-700">
              Connecté en tant que{" "}
              <strong className="text-blue-900">{session.user?.email}</strong>
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={afterLogin}>
                <Button type="button" className="w-full min-w-[220px] sm:w-auto">
                  <Package className="h-5 w-5" aria-hidden />
                  Accéder à mon envoi
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/client" })}
              >
                Déconnexion
              </Button>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-left">
              <p className="mb-2 text-sm font-bold text-slate-800">
                Recevoir le guide « comment remplir le formulaire » par e-mail
              </p>
              <Button
                type="button"
                variant="secondary"
                disabled={guideSending}
                onClick={sendGuideEmail}
                className="w-full sm:w-auto"
              >
                <Mail className="h-4 w-4" aria-hidden />
                {guideSending ? "Envoi…" : "M'envoyer le guide"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-center">
              <p className="text-sm font-semibold text-slate-800">Connexion avec Google</p>
              <p className="mt-1 text-xs text-slate-500">
                Première utilisation : un compte est créé automatiquement avec votre adresse Google.
              </p>
            </div>

            {!authStatusLoaded ? (
              <div
                className="mb-6 h-12 w-full animate-pulse rounded-xl bg-slate-100"
                aria-hidden
              />
            ) : googleEnabled ? (
              <>
                <Button
                  type="button"
                  className="w-full"
                  disabled={loading}
                  onClick={onGoogle}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuer avec Google
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">ou</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-950">
                <p className="font-semibold">Google n&apos;est pas activé côté serveur</p>
                <p className="mt-2 leading-relaxed text-amber-900/95">
                  Ajoutez les variables{" "}
                  <code className="rounded bg-white px-1 py-0.5 text-xs">GOOGLE_CLIENT_ID</code> et{" "}
                  <code className="rounded bg-white px-1 py-0.5 text-xs">GOOGLE_CLIENT_SECRET</code>{" "}
                  (Google Cloud Console → OAuth 2.0), plus{" "}
                  <code className="rounded bg-white px-1 py-0.5 text-xs">NEXTAUTH_URL</code> et{" "}
                  <code className="rounded bg-white px-1 py-0.5 text-xs">NEXTAUTH_SECRET</code>, dans
                  Vercel ou <code className="text-xs">.env.local</code>, puis redéployez.
                </p>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <div className="w-full border-t border-amber-200/80" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-amber-50 px-2 text-amber-800/80">ou</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4 flex gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                  tab === "login"
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setTab("register")}
                className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                  tab === "register"
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-slate-600"
                }`}
              >
                Inscription
              </button>
            </div>

            {tab === "login" ? (
              <form onSubmit={onLogin} className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn className="h-4 w-4" aria-hidden />
                  {loading ? "Connexion…" : "Se connecter"}
                </Button>
              </form>
            ) : (
              <form onSubmit={onRegister} className="space-y-4">
                <Input
                  label="Nom (optionnel)"
                  type="text"
                  autoComplete="name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
                <Input
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
                <Input
                  label="Mot de passe (8 caractères minimum)"
                  type="password"
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Création…" : "Créer mon compte"}
                </Button>
              </form>
            )}
          </>
        )}
      </div>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-blue-950">Comment remplir le formulaire d&apos;envoi</h2>
        <p className="mt-2 text-slate-600">
          Une fois connecté, suivez ces points pour un dossier complet et un traitement rapide.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-slate-700">
          {GUIDE_PREVIEW.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-500">
          Connectez-vous pour pouvoir recevoir ce récapitulatif par e-mail (si l&apos;envoi est
          configuré côté serveur).
        </p>
      </section>
    </div>
  );
}
