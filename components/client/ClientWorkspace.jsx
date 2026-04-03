"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { TARIFS } from "@/lib/constants";
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

export default function ClientWorkspace() {
  const searchParams = useSearchParams();
  const initialTrack = searchParams.get("track") || "";
  const { showToast } = useToast();

  const [apiDown, setApiDown] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTrack ? "track" : "send");
  const [trackId, setTrackId] = useState(initialTrack);
  const [tracked, setTracked] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);

  const [formData, setFormData] = useState({
    sender_name: "",
    sender_phone: "",
    receiver_phone: "",
    nature: "Document",
    destination: "Korhogo",
    delivery_mode: "ramassage",
    has_insurance: false,
    pickup_address: "",
    description: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [packingTips, setPackingTips] = useState([]);

  const calculatePrice = useCallback(() => {
    const dest = TARIFS.destinations[formData.destination] || 0;
    const mode =
      formData.delivery_mode === "ramassage"
        ? TARIFS.options.ramassage
        : TARIFS.options.depot;
    const ins = formData.has_insurance ? TARIFS.options.assurance : 0;
    return dest + mode + ins;
  }, [formData]);

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

  async function handleAnalyze() {
    if (!formData.description?.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: formData.description }),
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

  async function handleSend(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_name: formData.sender_name,
          sender_phone: formData.sender_phone,
          receiver_phone: formData.receiver_phone,
          destination: formData.destination,
          nature: formData.nature,
          delivery_mode: formData.delivery_mode,
          has_insurance: formData.has_insurance,
          pickup_address: formData.pickup_address,
          description: formData.description,
        }),
      });
      if (res.status === 503) {
        setApiDown(true);
        showToast("Base Insforge non configurée sur le serveur.", "error");
        return;
      }
      if (!res.ok) throw new Error("Création impossible");
      const data = await res.json();
      setApiDown(false);
      setTracked(data);
      setTrackId(data.package.id);
      setActiveTab("track");
      setPackingTips([]);
      showToast(`Colis ${data.package.id} enregistré.`, "success");
    } catch {
      showToast("Erreur à l'enregistrement.", "error");
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTracked(data);
      showToast("Merci pour votre avis !", "success");
    } catch {
      showToast("Erreur enregistrement note.", "error");
    }
  }

  const pkg = tracked?.package;
  const history = tracked?.history || [];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-900">
            Mon espace Trass CI
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            <Link href="/" className="text-blue-700 underline">
              Retour à l&apos;accueil
            </Link>
          </p>
        </div>

        {apiDown && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Serveur :</strong> configurez{" "}
            <code className="rounded bg-white px-1">INSFORGE_API_URL</code> et{" "}
            <code className="rounded bg-white px-1">INSFORGE_ANON_KEY</code>{" "}
            (Vercel ou .env.local) puis exécutez le SQL dans{" "}
            <code className="rounded bg-white px-1">sql/schema.sql</code>.
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
                  placeholder="Ex: Soro Nagony"
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
                  placeholder="Ex: 2 ordinateurs portables, chargeurs…"
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

              <div className="grid gap-6 rounded-2xl border border-slate-100 bg-slate-50 p-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Destination
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 outline-none"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                  >
                    {Object.keys(TARIFS.destinations).map((ville) => (
                      <option key={ville} value={ville}>
                        {ville} — {TARIFS.destinations[ville]} F
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Nature
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 outline-none"
                    value={formData.nature}
                    onChange={(e) =>
                      setFormData({ ...formData, nature: e.target.value })
                    }
                  >
                    <option value="Document">Document</option>
                    <option value="Vêtements">Vêtements</option>
                    <option value="Électronique">Électronique</option>
                    <option value="Marchandise">Marchandise</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Téléphone du destinataire"
                    required
                    value={formData.receiver_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        receiver_phone: e.target.value,
                      })
                    }
                  />
                </div>
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
                      Ramassage domicile
                    </span>
                    <span className="font-extrabold text-orange-600">+2000 F</span>
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
                    <span className="font-bold text-slate-500">Gratuit</span>
                  </label>
                </div>
                <div>
                  <p className="mb-3 text-sm font-bold text-slate-700">
                    Assurance
                  </p>
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-4 transition-all ${
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
                        Assurer ce colis (+1000 F)
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {formData.delivery_mode === "ramassage" && (
                <Input
                  required
                  placeholder="Adresse de ramassage (Yopougon, Cocody…)"
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
                    {calculatePrice()} FCFA
                  </p>
                </div>
                <Button type="submit" className="w-full md:w-auto">
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
                <div className="flex items-center justify-between bg-slate-800 p-6 text-white">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-300">
                      Suivi
                    </p>
                    <h2 className="font-mono text-2xl font-extrabold">
                      {pkg.id}
                    </h2>
                  </div>
                  <Barcode className="h-8 w-8 opacity-50" />
                </div>
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
                          Abidjan → {pkg.destination}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Destinataire : {pkg.receiver_phone}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="mb-1 text-xs font-bold uppercase text-slate-500">
                          Sécurité
                        </p>
                        {pkg.has_insurance ? (
                          <span className="flex items-center gap-1 text-sm font-bold text-green-600">
                            <Shield className="h-4 w-4" /> Assuré
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
