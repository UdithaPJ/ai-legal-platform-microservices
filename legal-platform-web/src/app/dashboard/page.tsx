import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { extractPrimaryRole } from "@/lib/utils";

/**
 * Central post-login router.
 *
 * Resolution order:
 *   ADMIN                              → /admin/dashboard
 *   LAWYER + PENDING_ONBOARDING        → /lawyer/onboarding
 *   LAWYER + PENDING_VERIFICATION      → /lawyer/pending-review
 *   LAWYER + REJECTED                  → /lawyer/onboarding  (re-submit flow)
 *   LAWYER + VERIFIED                  → /lawyer/dashboard
 *   CLIENT                             → /client/dashboard
 *   Unauthenticated                    → /
 *
 * The lawyer verification status is fetched from lawyer-service via the BFF
 * pattern so the access token is never exposed to the client.
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/");

  const role = extractPrimaryRole(session.user.roles ?? []);

  if (role === "ADMIN") redirect("/admin/dashboard");
  if (role === "CLIENT") redirect("/client/dashboard");

  // ── LAWYER: check verification status ────────────────────────────────────
  const verificationStatus = await fetchVerificationStatus(
    session.user.sub,
    session.accessToken
  );

  switch (verificationStatus) {
    case "PENDING_ONBOARDING":
    case "REJECTED":
      redirect("/lawyer/onboarding");
    case "PENDING_VERIFICATION":
      redirect("/lawyer/pending-review");
    case "VERIFIED":
      redirect("/lawyer/dashboard");
    default:
      // SUSPENDED or unknown — show a generic blocked page
      redirect("/unauthorized");
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchVerificationStatus(
  keycloakId: string,
  accessToken: string
): Promise<string> {
  try {
    const res = await fetch(
      `${process.env.API_GATEWAY_URL}/lawyers/user/${keycloakId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        // No caching — always fetch the current status on navigation
        cache: "no-store",
      }
    );

    if (!res.ok) {
      // Lawyer profile not yet created (event processing lag) — treat as onboarding
      return "PENDING_ONBOARDING";
    }

    const data = await res.json();
    return (data.verificationStatus as string) ?? "PENDING_ONBOARDING";
  } catch {
    // Network / gateway error — fall back to onboarding rather than crashing
    return "PENDING_ONBOARDING";
  }
}
