/** Clés de permission pour les routes admin (équipes). */
export const ADMIN_PERMISSION_KEYS = [
  "dashboard",
  "dispatch",
  "rules",
  "partners",
  "notes",
  "coursiers",
  "teams",
];

export const ADMIN_PERMISSION_LABELS = {
  dashboard: "Tableau de bord & analytics",
  dispatch: "Dispatch & hub opérations",
  rules: "Règles & tarifs",
  partners: "Partenaires",
  notes: "Notes internes",
  coursiers: "Coursiers",
  teams: "Équipes & accès (réservé super admin)",
};

/** Onglet dashboard → permission requise (sauf super). L’onglet access est réservé au super admin (contrôle séparé). */
export const TAB_PERMISSION = {
  admin_overview: "dashboard",
  access: "teams",
  dispatch: "dispatch",
  hub: "dispatch",
  rules: "rules",
  partners_admin: "partners",
  coursiers_admin: "coursiers",
  messages: "notes",
  delivery_status: "dashboard",
  calendar: "dashboard",
  ai_dashboard: "dashboard",
};
