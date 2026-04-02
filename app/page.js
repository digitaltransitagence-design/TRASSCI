/**
 * Page d'accueil — placeholder après étape 1 (layout + navigation).
 * La landing complète sera implémentée à l'étape 4.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/20 px-4 py-2 text-sm font-bold text-orange-300">
            Étape 1 — Projet initialisé
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Expédiez sans stress
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Next.js (App Router), Tailwind CSS et la structure Navigation + Footer sont en place.
            La page d&apos;accueil marketing arrive à l&apos;étape suivante.
          </p>
        </div>
      </section>
    </div>
  );
}
