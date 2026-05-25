import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const roles: string[] = session.user.roles ?? [];
  if (!roles.includes("ADMIN")) redirect("/auth/error?error=AccessDenied");

  return <>{children}</>;
}
