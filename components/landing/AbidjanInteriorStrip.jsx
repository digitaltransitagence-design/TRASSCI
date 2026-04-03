/**
 * Bandeau villes / axe — ancrage géographique Abidjan → intérieur.
 */
export default function AbidjanInteriorStrip() {
  const hubs = [
    "Abidjan",
    "Yamoussoukro",
    "Bouaké",
    "Korhogo",
    "San Pedro",
    "Man",
  ];
  return (
    <div className="mx-auto max-w-4xl px-6">
      <p className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-slate-500">
        Axe principal · départ Abidjan
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {hubs.map((city, i) => (
          <span key={city} className="flex items-center gap-2">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-200">
              {city}
            </span>
            {i < hubs.length - 1 && (
              <span className="hidden text-orange-400 sm:inline" aria-hidden>
                →
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        Un réseau pensé pour le <strong>last mile</strong> côté intérieur : la
        bonne info au bon moment évite les allers-retours inutiles à la gare.
      </p>
    </div>
  );
}
