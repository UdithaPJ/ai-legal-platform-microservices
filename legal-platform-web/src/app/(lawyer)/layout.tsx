import { AppShell } from "@/components/layout/AppShell";

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
  // TODO: restore auth + role check before merging to main
  // const session = await auth();
  // if (!session) redirect("/auth/signin");
  // const roles: string[] = session.user.roles ?? [];
  // const hasAccess = roles.includes("LAWYER") || roles.includes("ADMIN");
  // if (!hasAccess) redirect("/auth/error?error=AccessDenied");

  return <AppShell role="LAWYER">{children}</AppShell>;
}
