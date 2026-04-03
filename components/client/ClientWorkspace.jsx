"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Package,
  Search,
  Check,
  MapPin,
  Shield,
  Barcode,
  Activity,
  AlertTriangle,
  Sparkles,
  ImagePlus,
  Copy,
  Share2,
} from "lucide-react";
import { NATURE_OPTIONS } from "@/lib/constants";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Timeline from "@/components/ui/Timeline";
import { useToast } from "@/components/providers/ToastProvider";

function StarRating({ value, hover, onHover, onRate, disabled }) {
  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onMouseEnter={() => !disabled && onHover(star)}
          onMouseLeave={() => !disabled && onHover(0)}
          onClick={() => !disabled && onRate(star)}
          className="rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <svg
            className={`h-8 w-8 cursor-pointer transition-colors ${
              star <= (value || hover)
                ? "fill-current text-yellow-400"
                : "text-slate-300"
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function computeClientPrice(form, pricing) {
  if (!pricing?.destinations?.length) return 0;
  const dest = pricing.destinations.find(
    (d) => d.id === form.destination || d.name === form.destination
  );
  const destPrice = dest?.price ?? 0;
  const mode =
    form.delivery_mode === "ramassage"
      ? pricing.fees.ramassage
      : pricing.fees.depot;
  const ins = form.has_insurance ? pricing.fees.insurance : 0;
  return destPrice + mode + ins;
}

export default function ClientWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const initialTrack = searchParams.get("track") || "";
  const { showToast } = useToast();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const search = typeof window !== "undefined" ? window.location.search : "";
    const next = encodeURIComponent(`${path}${search}`);
    router.replace(`/client?next=${next}`);
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
        Vérification de la session…
      </div>
    );
  }
  if (!session) {
    return null;
  }

  const [pricing, setPricing] = useState(null);
  const [apiDown, setApiDown] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTrack ? "track" : "send");
  const [trackId, setTrackId] = useState(initialTrack);
  const [tracked, setTracked] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);

  const [formData, setFormData] = useState({
    sender_name: "",
    sender_phone: "",
    receiver_name: "",
    receiver_phone: "",
    declared_value: "",
    nature: "Document",
    destination: "",
    delivery_mode: "ramassage",
    has_insurance: false,
    pickup_address: "",
    description: "",
    photo_url: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [packingTips, setPackingTips] = useState([]);

  useEffect(() => {
    fetch("/api/pricing", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.destinations?.length) {
          setPricing({
            fees: data.fees || {
              ramassage: 1500,
              insurance: 1000,
              depot: 0,
            },
            destinations: data.destinations,
          });
          setFormData((prev) => ({
            ...prev,
            destination: prev.destination || data.destinations[0].id,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const loadTrack = useCallback(
    async (id) => {
      const q = (id || trackId).trim().toUpperCase();
      if (!q) return;
      try {
        const res = await fetch(
          `/api/packages?track=${encodeURIComponent(q)}`,
          { cache: "no-store" }
        );
        if (res.status === 503) {
          setApiDown(true);
          setTracked(null);
          setNotFound(false);
          return;
        }
        setApiDown(false);
        if (res.status === 404) {
          setTracked(null);
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Erreur réseau");
        const data = await res.json();
        setTracked(data);
        setNotFound(false);
      } catch {
        showToast("Impossible de charger le suivi.", "error");
      }
    },
    [trackId, showToast]
  );

  useEffect(() => {
    if (initialTrack) {
      setTrackId(initialTrack);
      loadTrack(initialTrack);
    }
  }, [initialTrack, loadTrack]);

  function destinationLabel(slug) {
    const d = pricing?.destinations?.find(
      (x) => x.id === slug || x.name === slug
    );
    return d?.name || slug;
  }

  async function handleAnalyze() {
    if (!formData.description?.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: formData.description,
          declared_value: formData.declared_value,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur IA");
      }
      const result = await res.json();
      const natureMap = {
        Document: "Document",
        Vêtements: "Vêtements",
        Électronique: "Électronique",
        Marchandise: "Marchandise",
        "Écrans & TV": "Écrans & TV",
        "Écrans et TV": "Écrans & TV",
      };
      setFormData((prev) => ({
        ...prev,
        nature: natureMap[result.categorie] || prev.nature,
        has_insurance: result.fragile ? true : prev.has_insurance,
      }));
      setPackingTips(result.conseils || []);
      showToast("Contenu analysé par l'IA.", "success");
    } catch (e) {
      showToast(e.message || "Erreur analyse IA.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function onPhotoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choisissez une image (photo du colis).", "error");
      return;
    }
    if (file.size > 1.8 * 1024 * 1024) {
      showToast("Image trop lourde (max ~1,8 Mo).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, photo_url: String(reader.result) }));
      showToast("Photo ajoutée.", "success");
    };
    reader.readAsDataURL(file);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!pricing) {
      showToast("Chargement des tarifs… réessayez.", "error");
      return;
    }
    if (formData.delivery_mode === "ramassage") {
      if ((formData.pickup_address || "").trim().length < 12) {
        showToast(
          "Précisez l'adresse de ramassage (quartier, rue, repère).",
          "error"
        );
        return;
      }
    }
    const declaredNum = parseInt(String(formData.declared_value), 10) || 0;
    if (formData.has_insurance && declaredNum <= 0) {
      showToast(
        "Assurance : indiquez une valeur déclarée estimée (FCFA) pour le colis.",
        "error"
      );
      return;
    }
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_name: formData.sender_name,
          sender_phone: formData.sender_phone,
          receiver_name: formData.receiver_name,
          receiver_phone: formData.receiver_phone,
          declared_value: declaredNum,
          destination: formData.destination,
          nature: formData.nature,
          delivery_mode: formData.delivery_mode,
          has_insurance: formData.has_insurance,
          pickup_address: formData.pickup_address,
          description: formData.description,
          photo_url: formData.photo_url || null,
        }),
      });
      if (res.status === 503) {
        setApiDown(true);
        showToast("Base Insforge non configurée sur le serveur.", "error");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Création impossible");
      }
      setApiDown(false);
      setTracked(data);
      setTrackId(data.package.id);
      setActiveTab("track");
      setPackingTips([]);
      showToast(`Colis ${data.package.id} enregistré.`, "success");
    } catch (err) {
      showToast(err.message || "Erreur à l'enregistrement.", "error");
    }
  }

  async function copyTrackingId() {
    const id = tracked?.package?.id;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      showToast("Numéro de suivi copié.", "success");
    } catch {
      showToast("Copie impossible sur ce navigateur.", "error");
    }
  }

  async function shareTrackingLink() {
    const id = tracked?.package?.id;
    if (!id) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/client/envoi?track=${encodeURIComponent(id)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Suivi Trass CI — ${id}`,
          text: `Suivez le colis ${id} sur Trass CI.`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Lien de suivi copié.", "success");
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        showToast("Lien copié.", "success");
      } catch {
        showToast("Partage indisponible.", "error");
      }
    }
  }

  async function handleRate(stars) {
    if (!tracked?.package?.id || tracked.package.rating != null) return;
    try {
      const res = await fetch(`/api/packages/${tracked.package.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: stars,
          appendHistory: false,
          author: "Client",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur");
      }
      const data = await res.json();
      setTracked(data);
      showToast("Merci pour votre avis !", "success");
    } catch (e) {
      showToast(e.message || "Erreur enregistrement note.", "error");
    }
  }

  const pkg = tracked?.package;
  const history = tracked?.history || [];
  const total =
    pricing != null ? computeClientPrice(formData, pricing) : null;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-900">
            Mon espace Trass CI
          </h1>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <Link href="/client" className="text-blue-700 underline">
              Mon compte
            </Link>
            <span aria-hidden className="text-slate-300">
              ·
            </span>
            <Link href="/" className="text-blue-700 underline">
              Accueil
            </Link>
          </p>
        </div>

        {apiDown && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Serveur :</strong> configurez Insforge et exécutez{" "}
            <code className="rounded bg-white px-1">sql/schema.sql</code>,{" "}
            <code className="rounded bg-white px-1">migration_v2_rules.sql</code> et{" "}
            <code className="rounded bg-white px-1">migration_v3_features.sql</code> si besoin.
          </div>
        )}

        <div className="mb-6 flex max-w-md mx-auto rounded-2xl bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("send")}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
              activeTab === "send"
                ? "bg-blue-900 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Envoyer un colis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("track")}
            className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
              activeTab === "track"
                ? "bg-blue-900 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            Suivre un colis
          </button>
        </div>

        {activeTab === "send" && (
          <form
            onSubmit={handleSend}
            className="overflow-hidden rounded-3xl bg-white shadow-xl animate-fade-in"
          >
            <div className="border-b border-slate-100 bg-slate-50 p-6">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800">
                <Package className="h-5 w-5" />
                Formulaire d&apos;expédition
              </h2>
            </div>
            <div className="space-y-8 p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Votre nom complet"
                  required
                  value={formData.sender_name}
                  onChange={(e) =>
                    setFormData({ ...formData, sender_name: e.target.value })
                  }
                />
                <Input
                  label="Votre WhatsApp"
                  required
                  value={formData.sender_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, sender_phone: e.target.value })
                  }
                  placeholder="07 XX XX XX XX"
                />
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-inner">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-indigo-900">
                    Que contient votre colis ?
                  </span>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !formData.description?.trim()}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:bg-indigo-300"
                  >
                    {isAnalyzing ? (
                      "Analyse…"
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Optimiser ✨
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  className="mb-4 w-full rounded-xl border border-indigo-200 bg-white p-4 text-slate-700 outline-none focus:border-indigo-500"
                  rows={3}
                  placeholder="Décrivez le contenu (écrans, cartons, etc.)"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                {packingTips.length > 0 && (
                  <div className="rounded-xl border border-indigo-100 bg-white p-4 text-sm shadow-sm">
                    <p className="mb-2 flex items-center gap-2 font-bold text-indigo-900">
                      <Sparkles className="h-4 w-4" />
                      Conseils IA
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-slate-700">
                      {packingTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
                  <ImagePlus className="h-4 w-4" />
                  Photo du colis (optionnel)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm text-slate-600"
                  onChange={onPhotoFile}
                />
                {formData.photo_url && (
                  <p className="mt-2 text-xs text-green-700">
                    Photo prête à l&apos;envoi.
                  </p>
                )}
              </div>

              <div className="grid gap-6 rounded-2xl border border-slate-100 bg-slate-50 p-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Destination
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 outline-none"
                    required
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                  >
                    {(pricing?.destinations || []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.price} FCFA
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Nature (les écrans / TV = risque élevé)
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 outline-none"
                    value={formData.nature}
                    onChange={(e) =>
                      setFormData({ ...formData, nature: e.target.value })
                    }
                  >
                    {NATURE_OPTIONS.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Nom complet du destinataire"
                  required
                  value={formData.receiver_name}
                  onChange={(e) =>
                    setFormData({ ...formData, receiver_name: e.target.value })
                  }
                />
                <Input
                  label="WhatsApp du destinataire"
                  required
                  value={formData.receiver_phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receiver_phone: e.target.value,
                    })
                  }
                  placeholder="07 XX XX XX XX"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-bold text-slate-700">
                    Remise à Abidjan
                  </p>
                  <label
                    className={`mb-3 flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
                      formData.delivery_mode === "ramassage"
                        ? "border-orange-500 bg-orange-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-3 font-bold text-slate-800">
                      <input
                        type="radio"
                        checked={formData.delivery_mode === "ramassage"}
                        onChange={() =>
                          setFormData({ ...formData, delivery_mode: "ramassage" })
                        }
                        className="h-4 w-4"
                      />
                      Ramassage à domicile
                    </span>
                    <span className="font-extrabold text-orange-600">
                      +{pricing?.fees?.ramassage ?? "…"} F
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
                      formData.delivery_mode === "depot"
                        ? "border-blue-900 bg-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-3 font-bold text-slate-800">
                      <input
                        type="radio"
                        checked={formData.delivery_mode === "depot"}
                        onChange={() =>
                          setFormData({ ...formData, delivery_mode: "depot" })
                        }
                        className="h-4 w-4"
                      />
                      Dépôt agence
                    </span>
                    <span className="font-bold text-slate-500">
                      {pricing?.fees?.depot === 0 ? "Gratuit" : `${pricing?.fees?.depot} F`}
                    </span>
                  </label>
                </div>
                <div>
                  <p className="mb-3 text-sm font-bold text-slate-700">
                    Assurance (valeur déclarée obligatoire)
                  </p>
                  <label
                    className={`mb-3 flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
                      formData.has_insurance
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.has_insurance}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            has_insurance: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded"
                      />
                      <span className="font-bold text-slate-800">
                        Assurer (+{pricing?.fees?.insurance ?? "…"} F / colis)
                      </span>
                    </span>
                  </label>
                  <Input
                    label="Valeur déclarée estimée (FCFA)"
                    type="number"
                    min={0}
                    value={formData.declared_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        declared_value: e.target.value,
                      })
                    }
                    placeholder="Ex: 150000"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Sert de base en cas de sinistre couvert — obligatoire si assurance
                    cochée.
                  </p>
                </div>
              </div>

              {formData.delivery_mode === "ramassage" && (
                <Textarea
                  label="Adresse précise de ramassage (quartier, rue, repères)"
                  required
                  rows={3}
                  placeholder="Ex: Yopougon Sicogi, non loin de la pharmacie…"
                  value={formData.pickup_address}
                  onChange={(e) =>
                    setFormData({ ...formData, pickup_address: e.target.value })
                  }
                />
              )}

              <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-100 pt-8 md:flex-row">
                <div>
                  <p className="mb-1 text-sm text-slate-500">Total estimé</p>
                  <p className="text-3xl font-extrabold text-slate-800">
                    {total != null ? `${total} FCFA` : "…"}
                  </p>
                </div>
                <Button type="submit" className="w-full md:w-auto" disabled={!pricing}>
                  Valider <Check className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </form>
        )}

        {activeTab === "track" && (
          <div className="rounded-3xl bg-white p-8 shadow-xl animate-fade-in">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadTrack();
              }}
              className="mb-10 flex gap-2"
            >
              <input
                required
                type="text"
                placeholder="TRASS-XXXX"
                className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-4 font-mono uppercase outline-none transition focus:border-blue-900"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
              />
              <Button type="submit" variant="secondary" className="shrink-0 px-6">
                <Search className="h-5 w-5" />
              </Button>
            </form>

            {notFound && (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-red-50 p-8 text-center font-medium text-red-600">
                <Activity className="h-8 w-8" />
                Numéro de suivi introuvable.
              </div>
            )}

            {pkg && (
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {pkg.issue && (
                  <div className="flex items-center gap-3 bg-red-500 p-4 font-medium text-white">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    Attention : {pkg.issue}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800 p-6 text-white">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-300">
                      Suivi
                    </p>
                    <h2 className="font-mono text-2xl font-extrabold">
                      {pkg.id}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyTrackingId}
                      className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20"
                    >
                      <Copy className="h-4 w-4" />
                      Copier
                    </button>
                    <button
                      type="button"
                      onClick={shareTrackingLink}
                      className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20"
                    >
                      <Share2 className="h-4 w-4" />
                      Partager
                    </button>
                    <Barcode className="hidden h-8 w-8 opacity-50 sm:block" />
                  </div>
                </div>
                {pkg.photo_url && (
                  <div className="border-b border-slate-100 bg-slate-50 p-4">
                    <p className="mb-2 text-xs font-bold uppercase text-slate-500">
                      Photo du colis
                    </p>
                    <img
                      src={pkg.photo_url}
                      alt="Colis"
                      className="max-h-56 rounded-xl object-contain"
                    />
                  </div>
                )}
                <div className="grid gap-8 p-6 md:grid-cols-2">
                  <div className="space-y-6">
                    <div className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                      <div className="rounded-lg bg-white p-2 text-blue-900 shadow-sm">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-bold uppercase text-slate-500">
                          Trajet
                        </p>
                        <p className="font-bold text-slate-800">
                          Abidjan → {destinationLabel(pkg.destination)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {pkg.receiver_name && (
                            <span className="font-medium text-slate-700">
                              {pkg.receiver_name} —{" "}
                            </span>
                          )}
                          WhatsApp : {pkg.receiver_phone}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {pkg.nature}
                          {pkg.has_insurance && pkg.declared_value > 0 && (
                            <span>
                              {" "}
                              · Assuré (valeur décl. {pkg.declared_value} F)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="mb-1 text-xs font-bold uppercase text-slate-500">
                          Sécurité
                        </p>
                        {pkg.has_insurance ? (
                          <span className="flex flex-col gap-1 text-sm font-bold text-green-600">
                            <span className="flex items-center gap-1">
                              <Shield className="h-4 w-4" /> Assuré
                            </span>
                            {pkg.declared_value > 0 && (
                              <span className="text-xs font-normal text-slate-600">
                                Valeur décl. {pkg.declared_value} FCFA
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-500">
                            Standard
                          </span>
                        )}
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="mb-1 text-xs font-bold uppercase text-slate-500">
                          Mode Abidjan
                        </p>
                        <p className="text-sm font-bold capitalize text-slate-800">
                          {pkg.delivery_mode}
                        </p>
                      </div>
                    </div>
                    {pkg.status === "DELIVERED" && (
                      <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6 text-center">
                        <p className="mb-1 font-bold text-slate-800">
                          Colis livré
                        </p>
                        <p className="mb-4 text-sm text-slate-600">
                          Votre avis compte pour nous.
                        </p>
                        <StarRating
                          value={pkg.rating}
                          hover={ratingHover}
                          onHover={setRatingHover}
                          onRate={handleRate}
                          disabled={pkg.rating != null}
                        />
                        {pkg.rating != null && (
                          <p className="mt-3 text-xs font-bold text-green-600">
                            Merci : {pkg.rating}/5
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <Timeline
                    currentStatus={pkg.status}
                    history={history}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
