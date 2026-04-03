import { Bell, MapPin, Smartphone } from "lucide-react";

/**
 * Mise en avant du suivi par notifications — pilier UX sur l’axe Abidjan → intérieur.
 */
export default function NotificationShowcase() {
  const messages = [
    {
      title: "Ramassage confirmé",
      body: "Votre colis TRASS-8492 est pris en charge à Cocody. Direction le hub Trass CI.",
      time: "09:12",
      tone: "bg-emerald-50 border-emerald-200",
    },
    {
      title: "En route vers l'intérieur",
      body: "Colis embarqué — ligne vers Bouaké. Votre destinataire sera prévenu à l'arrivée en gare.",
      time: "14:05",
      tone: "bg-sky-50 border-sky-200",
    },
    {
      title: "Prêt au retrait",
      body: "Bonjour — le colis est arrivé au comptoir partenaire. Présentez la CNI pour la remise.",
      time: "Lendemain · 08:40",
      tone: "bg-orange-50 border-orange-200",
    },
  ];

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-900/5 px-4 py-2 text-sm font-bold text-blue-900">
          <Bell className="h-4 w-4" aria-hidden />
          Suivi proactif
        </div>
        <h3 className="mb-4 text-2xl font-extrabold text-slate-900 md:text-3xl">
          L&apos;info arrive{" "}
          <span className="text-orange-500">avant</span> la gare
        </h3>
        <p className="mb-6 text-lg leading-relaxed text-slate-600">
          Sur l&apos;axe <strong>Abidjan → intérieur</strong>, la distance et le
          trajet routier créent de l&apos;incertitude. Trass CI structure le
          parcours en <strong>statuts clairs</strong> et vous prévient aux
          moments décisifs : prise en charge, départ ligne, arrivée en gare,
          disponibilité au retrait — pour que vous et le destinataire ne
          « couriez » pas les informations.
        </p>
        <ul className="space-y-3 text-slate-700">
          <li className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
            <span>
              Visibilité du trajet <em>Abidjan — hub — gare partenaire — ville</em>{" "}
              de destination.
            </span>
          </li>
          <li className="flex gap-3">
            <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
            <span>
              Numéro de suivi unique : même logique qu&apos;un message qui
              confirme « votre courrier est arrivé au bureau » — appliquée au
              colis et au terrain ivoirien.
            </span>
          </li>
        </ul>
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-blue-900/20 to-orange-500/20 blur-sm" />
        <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-900 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm font-bold text-white">Trass CI · Suivi</span>
          </div>
          <div className="space-y-3 bg-slate-100 p-4">
            {messages.map((m) => (
              <div
                key={m.title}
                className={`rounded-2xl border p-4 shadow-sm ${m.tone}`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">{m.title}</span>
                  <span className="text-[10px] text-slate-500">{m.time}</span>
                </div>
                <p className="text-sm leading-snug text-slate-700">{m.body}</p>
              </div>
            ))}
          </div>
          <p className="border-t border-slate-200 bg-white px-4 py-2 text-center text-[10px] text-slate-500">
            Exemple illustratif — canaux selon votre configuration (SMS, WhatsApp, app).
          </p>
        </div>
      </div>
    </div>
  );
}
