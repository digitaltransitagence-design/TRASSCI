import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "Connexion administration | Trass CI",
  description: "Accès réservé — distinct de l’espace client public.",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
