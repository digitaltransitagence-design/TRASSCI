import AdminGate from "@/components/admin/AdminGate";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "Portail Pro | Trass CI",
  description:
    "Dispatch, hub, partenaires, messages, statuts livraison, calendrier d’envois.",
};

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
