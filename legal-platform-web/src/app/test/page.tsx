import { auth } from "@/lib/auth";

// Development-only page for verifying Keycloak role extraction.
// Remove or gate behind an env check before deploying to production.
export default async function AuthTestPage() {
  const session = await auth();

  const debug = session
    ? {
        user: session.user,
        roles: session.user.roles,
        // Truncate tokens so the page is safe to screenshot in demos
        accessToken: session.accessToken
          ? `${session.accessToken.slice(0, 20)}…`
          : null,
        refreshToken: session.refreshToken
          ? `${session.refreshToken.slice(0, 20)}…`
          : null,
        error: session.error ?? null,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Auth Debug</h1>
          <p className="text-sm text-gray-500">
            Session status:{" "}
            <span
              className={
                session
                  ? "font-medium text-green-600"
                  : "font-medium text-red-600"
              }
            >
              {session ? "authenticated" : "unauthenticated"}
            </span>
          </p>
        </div>

        {session ? (
          <pre className="overflow-auto rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-800">
            {JSON.stringify(debug, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-gray-600">
            No session found. Sign in first, then revisit this page.
          </p>
        )}
      </div>
    </div>
  );
}
