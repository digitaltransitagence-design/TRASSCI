import ClientSessionProvider from "@/components/providers/ClientSessionProvider";

export default function ClientLayout({ children }) {
  return <ClientSessionProvider>{children}</ClientSessionProvider>;
}
