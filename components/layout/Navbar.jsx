"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package } from "lucide-react";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/client", label: "Mon espace" },
  { href: "/admin", label: "Portail Pro" },
];

/**
 * Barre de navigation principale — sticky, fond clair avec accent marque Trass CI.
 */
export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-blue-900 transition-opacity hover:opacity-90"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
            <Package className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            TRASS<span className="text-orange-500">CI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Navigation principale">
          {navLinks.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors sm:px-4 ${
                  active
                    ? href === "/admin"
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-blue-50 text-blue-900 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
