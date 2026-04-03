import Link from "next/link";
import {
  Package,
  Truck,
  Check,
  Search,
  Bike,
  Shield,
  Sparkles,
} from "lucide-react";
import { LandingTrackForm } from "@/components/landing/LandingTrackForm";

export const metadata = {
  title: "Trass CI — Expédiez sans stress | Abidjan → Intérieur",
  description:
    "Logistique bout en bout en Côte d'Ivoire : ramassage, assurance, suivi et remise en gare.",
};

export default function Home() {
  return (
    <div className="flex flex-col bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 px-6 pb-24 pt-20 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(https://www.transparenttextures.com/patterns/cubes.png)",
          }}
        />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/20 px-4 py-2 text-sm font-bold text-orange-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
              1er réseau logistique Abidjan — Intérieur
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
              Expédiez sans stress
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-blue-100 md:text-xl">
              De la collecte à domicile jusqu&apos;à la remise en gare à
              l&apos;intérieur du pays.{" "}
              <strong className="text-white">
                Ramassage, assurance, suivi et partenaires de confiance.
              </strong>
            </p>
            <LandingTrackForm />
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-medium text-blue-200">
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-400" />
                Partenaires fiables (SBTA, UTB…)
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-400" />
                Remise sur CNI
              </span>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 blur-[100px]" />
            <div className="relative rotate-2 rounded-3xl border border-white/20 bg-white/10 p-2 backdrop-blur-md transition-transform duration-500 hover:rotate-0">
              <img
                src="https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=800&q=80"
                alt="Logistique Côte d'Ivoire"
                className="rounded-2xl shadow-2xl"
                width={800}
                height={600}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-900 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 divide-x divide-slate-800 px-6 text-center md:grid-cols-4">
          {[
            ["100%", "Couverture nationale"],
            ["+5 000", "Colis sécurisés"],
            ["12", "Gares partenaires"],
            ["24/7", "Suivi & assistance"],
          ].map(([n, l]) => (
            <div key={l} className="first:border-0">
              <p
                className={`mb-1 text-3xl font-extrabold ${n.includes("+") ? "text-orange-500" : n === "24/7" ? "text-green-400" : "text-white"}`}
              >
                {n}
              </p>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {l}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-slate-800">
              Nos garanties
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-500">
              Assurance optionnelle, remise sur pièce d&apos;identité, ramassage
              à Abidjan.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Assurance perte & casse",
                desc: "Optez pour l&apos;assurance pour plus de sérénité sur la valeur déclarée.",
                color: "bg-blue-100 text-blue-900",
              },
              {
                icon: Check,
                title: "Remise sur CNI",
                desc: "Vérification de l&apos;identité du destinataire en gare partenaire.",
                color: "bg-green-100 text-green-600",
              },
              {
                icon: Bike,
                title: "Ramassage à domicile",
                desc: "À Abidjan, nos coursiers viennent chercher votre colis à l&apos;adresse indiquée.",
                color: "bg-orange-100 text-orange-600",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-8 transition-shadow hover:shadow-lg"
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-800">{title}</h3>
                <p className="leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-slate-800">
              Comment ça marche
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-500">
              Un processus clair, du premier clic à la remise en gare.
            </p>
          </div>
          <div className="relative grid gap-8 md:grid-cols-4">
            <div className="absolute left-[10%] right-[10%] top-10 -z-0 hidden h-1 rounded-full bg-slate-200 md:block">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-900 to-orange-500 opacity-50" />
            </div>
            {[
              {
                i: Package,
                c: "text-blue-900 bg-blue-100",
                t: "1. Réservation",
                d: "Créez l&apos;envoi en ligne : tarif transparent selon la destination.",
              },
              {
                i: Bike,
                c: "text-orange-500 bg-orange-100",
                t: "2. Prise en charge",
                d: "Ramassage ou dépôt à l&apos;agence — identifiant unique attribué.",
              },
              {
                i: Truck,
                c: "text-purple-700 bg-purple-100",
                t: "3. Transit",
                d: "Tri au hub, liaison gares partenaires, transport vers l&apos;intérieur.",
              },
              {
                i: Check,
                c: "text-green-600 bg-green-100",
                t: "4. Retrait",
                d: "Le destinataire retire le colis en gare avec sa CNI.",
              },
            ].map(({ i: Icon, c, t, d }) => (
              <div
                key={t}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div
                  className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white shadow-xl ${c}`}
                >
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-lg font-bold text-slate-800">{t}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Link
              href="/client"
              className="inline-flex items-center justify-center rounded-xl bg-blue-900 px-10 py-4 text-lg font-extrabold text-white shadow-xl transition hover:bg-blue-800"
            >
              Envoyer un colis
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-slate-800">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Quelles destinations sont desservies ?",
                a: "Les principales villes depuis Abidjan : Korhogo, Bouaké, San Pedro, Yamoussoukro, Man — selon disponibilité des lignes partenaires.",
              },
              {
                q: "Que couvre l'assurance ?",
                a: "L'assurance optionnelle peut couvrir perte ou casse selon les conditions affichées lors de la commande et la valeur déclarée.",
              },
              {
                q: "Comment le destinataire récupère-t-il le colis ?",
                a: "En gare partenaire, sur présentation d'une pièce d'identité valide (CNI, passeport ou permis selon les règles du point de retrait).",
              },
              {
                q: "Comment payer ?",
                a: "Le paiement s'effectue selon le mode indiqué lors de la prise en charge (coursier ou agence).",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-6"
              >
                <h4 className="mb-2 flex items-start gap-3 text-lg font-bold text-slate-800">
                  <span className="text-orange-500">Q.</span> {q}
                </h4>
                <p className="pl-7 leading-relaxed text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-orange-500 px-6 py-20 text-center">
        <h2 className="mb-6 text-3xl font-extrabold text-white md:text-4xl">
          Prêt à expédier ?
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-orange-100">
          Créez un envoi ou suivez un colis depuis votre espace client.
        </p>
        <Link
          href="/client"
          className="inline-flex items-center gap-3 rounded-xl bg-slate-900 px-12 py-5 text-xl font-extrabold text-white shadow-2xl transition hover:bg-slate-800"
        >
          <Sparkles className="h-6 w-6" />
          Mon espace Trass CI
        </Link>
      </section>
    </div>
  );
}
