import { AppShell } from "@/components/layout/AppShell";

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="LAWYER">{children}</AppShell>;
}
