import { Phone } from "lucide-react";

/**
 * Carte notification flottante (hero) — même esprit que la maquette :
 * fond blanc, icône téléphone sur vert clair, titre + message en gras.
 * @param {{ inline?: boolean }} props — inline : pas en absolute (ex. mobile sous le texte).
 */
export default function HeroFloatingNotification({ inline = false }) {
  const wrap = inline
    ? "relative z-20 mx-auto mt-8 max-w-[22rem] select-none lg:hidden"
    : "pointer-events-none absolute -bottom-4 -left-6 z-20 max-w-[min(100%,22rem)] select-none sm:-bottom-5 sm:-left-8 lg:-left-10 max-lg:hidden";

  return (
    <div className={wrap} aria-hidden={!inline}>
      <div className="pointer-events-auto flex items-start gap-4 rounded-[1.35rem] bg-white p-4 pr-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5 animate-float">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
          <Phone className="h-7 w-7 text-emerald-800" strokeWidth={2} />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-medium text-slate-500">
            Notification instantanée
          </p>
          <p className="mt-1 text-[15px] font-extrabold leading-snug text-slate-900">
            &laquo; Votre colis est arrivé à Bouaké ! &raquo;
          </p>
        </div>
      </div>
    </div>
  );
}
