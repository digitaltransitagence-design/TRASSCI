import { Suspense } from "react";
import ClientWorkspace from "@/components/client/ClientWorkspace";

export const metadata = {
  title: "Envoi & suivi | Espace client | Trass CI",
  description: "Créer un envoi et suivre vos colis.",
};

export default function ClientEnvoiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
          Chargement…
        </div>
      }
    >
      <ClientWorkspace />
    </Suspense>
  );
}
