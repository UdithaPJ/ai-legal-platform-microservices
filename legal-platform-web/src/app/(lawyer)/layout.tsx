import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LawyerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const roles: string[] = session.user.roles ?? [];
  const hasAccess = roles.includes("LAWYER") || roles.includes("ADMIN");
  if (!hasAccess) redirect("/auth/error?error=AccessDenied");

  return <>{children}</>;
}
