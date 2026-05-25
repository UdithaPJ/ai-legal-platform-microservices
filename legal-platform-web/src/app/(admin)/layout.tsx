import { AppShell } from "@/components/layout/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // TODO: restore auth + role check before merging to main
  return <AppShell role="ADMIN">{children}</AppShell>;
}
