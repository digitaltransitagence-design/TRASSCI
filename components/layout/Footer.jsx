"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";

/**
 * Pied de page global — masqué sur /admin (portail plein écran).
 */
export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white">
            <Package className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
            TRASS<span className="text-orange-500">CI</span>
          </span>
        </div>
        <p className="text-sm">
          © {new Date().getFullYear()} Trass CI Logistique. Tous droits réservés — Abidjan,
          Côte d&apos;Ivoire.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="#" className="transition-colors hover:text-white">
            Support
          </Link>
          <Link href="#" className="transition-colors hover:text-white">
            Conditions générales
          </Link>
        </div>
      </div>
    </footer>
  );
}
