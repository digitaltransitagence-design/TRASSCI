"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

/**
 * Bloc code admin (même logique que /admin/login + sessionStorage).
 * @param {object} props
 * @param {() => void} props.onMemorized — après « Mémoriser » (recharger données)
 * @param {string} [props.successHint] — phrase affichée en vert quand le code est déjà actif
 */
export default function AdminSecretBanner({ onMemorized, successHint }) {
  const { showToast } = useToast();
  const [adminSecretRequired, setAdminSecretRequired] = useState(null);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [adminSecretInput, setAdminSecretInput] = useState("");

  const hint =
    successHint ||
    "Vous pouvez enregistrer les modifications ci-dessous.";

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("trass_admin_secret") || "";
      setAdminSecretInput(s);
      setHasStoredSecret(Boolean(s.trim()));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAdminSecretRequired(Boolean(d.adminSecretRequired)))
      .catch(() => setAdminSecretRequired(true));
  }, []);

  function saveSecret() {
    sessionStorage.setItem("trass_admin_secret", adminSecretInput.trim());
    setHasStoredSecret(Boolean(adminSecretInput.trim()));
    showToast("Code enregistré pour cette session.", "success");
    onMemorized?.();
  }

  return (
    <>
      {adminSecretRequired === null && (
        <p className="text-xs text-slate-500">Vérification du mode sécurité serveur…</p>
      )}

      {adminSecretRequired === false && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Mode serveur sans <code className="rounded bg-white px-1">ADMIN_SECRET</code> : pas de
          code requis ici (prudence en production).
        </p>
      )}

      {adminSecretRequired === true && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            hasStoredSecret
              ? "border-green-300 bg-green-50 text-green-950"
              : "border-amber-300 bg-amber-50 text-amber-950"
          }`}
        >
          {hasStoredSecret ? (
            <>
              <strong>Code admin actif.</strong> Même mot de passe que{" "}
              <code className="rounded bg-white/80 px-1">/admin/login</code> et la variable{" "}
              <code className="rounded bg-white/80 px-1">ADMIN_SECRET</code> sur le serveur.{" "}
              {hint}
            </>
          ) : (
            <>
              <strong>Saisissez le code admin.</strong> C&apos;est la{" "}
              <strong>même valeur</strong> que sur la page{" "}
              <code className="rounded bg-white px-1">/admin/login</code> (variable{" "}
              <code className="rounded bg-white px-1">ADMIN_SECRET</code> sur Vercel), puis{" "}
              <strong>Mémoriser</strong>.
            </>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="password"
              className={`min-w-[200px] flex-1 rounded-lg border px-3 py-2 ${
                hasStoredSecret
                  ? "border-green-300 bg-white"
                  : "border-amber-300 bg-white"
              }`}
              placeholder="Même code que /admin/login"
              value={adminSecretInput}
              onChange={(e) => setAdminSecretInput(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={saveSecret}>
              Mémoriser
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
