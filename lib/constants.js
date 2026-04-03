/** Tarifs par défaut si la base n’est pas encore migrée (voir /api/pricing). */
export const TARIFS_FALLBACK = {
  destinations: {
    korhogo: 3000,
    bouake: 2000,
    "san-pedro": 3500,
    yamoussoukro: 1500,
    man: 4000,
  },
  options: { depot: 0, ramassage: 1500, assurance: 1000 },
};

/** Nature du colis — les écrans / TV = risque le plus élevé (casse, valeur). */
export const NATURE_OPTIONS = [
  { id: "Document", label: "Document", risk: "low" },
  { id: "Vêtements", label: "Vêtements", risk: "low" },
  { id: "Marchandise", label: "Marchandise", risk: "medium" },
  { id: "Électronique", label: "Électronique", risk: "high" },
  { id: "Écrans & TV", label: "Écrans & TV (forte valeur / casse)", risk: "highest" },
];

export const STATUS_FLOW = [
  {
    id: "PENDING",
    label: "Enregistré",
    desc: "Commande validée par le client",
    color: "bg-slate-100 text-slate-600",
  },
  {
    id: "PICKING_UP",
    label: "Ramassage",
    desc: "Coursier en route vers le client",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "AT_HUB",
    label: "Centre Trass CI",
    desc: "Colis trié à notre agence",
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    id: "AT_STATION",
    label: "À la Gare",
    desc: "Remis au transporteur partenaire",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "IN_TRANSIT",
    label: "En Transit",
    desc: "En route vers la destination",
    color: "bg-orange-100 text-orange-800",
  },
  {
    id: "READY_FOR_PICKUP",
    label: "Arrivé",
    desc: "Prêt à être retiré à la gare",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "DELIVERED",
    label: "Livré",
    desc: "Retiré par le destinataire (CNI vérifiée)",
    color: "bg-green-100 text-green-800",
  },
];

export const PACKAGE_STATUSES = STATUS_FLOW.map((s) => s.id);

/** Génère un ID type TRASS-1234 */
export function generatePackageId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TRASS-${n}`;
}
