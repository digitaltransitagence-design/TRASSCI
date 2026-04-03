"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Package, Search } from "lucide-react";

export function LandingTrackForm() {
  const router = useRouter();
  const [trackId, setTrackId] = useState("");

  function handleQuickTrack(e) {
    e.preventDefault();
    const q = trackId.trim();
    if (q) {
      router.push(`/client?track=${encodeURIComponent(q)}`);
    } else {
      router.push("/client");
    }
  }

  return (
    <div className="mb-8 flex flex-col gap-2 sm:flex-row">
      <form
        onSubmit={handleQuickTrack}
        className="flex flex-1 overflow-hidden rounded-xl bg-white shadow-inner"
      >
        <input
          type="text"
          placeholder="N° de suivi (ex: TRASS-8492)"
          className="w-full px-4 py-3 font-mono uppercase text-slate-800 outline-none"
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
        />
        <button
          type="submit"
          className="bg-slate-100 px-6 text-blue-900 transition-colors hover:bg-slate-200"
          aria-label="Rechercher"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
      <button
        type="button"
        onClick={() => router.push("/client")}
        className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-orange-500 px-8 py-3 font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
      >
        Nouvel envoi <Package className="h-5 w-5" />
      </button>
    </div>
  );
}
