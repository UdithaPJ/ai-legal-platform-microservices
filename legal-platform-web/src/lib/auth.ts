import NextAuth from "next-auth";
import type { Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";
import KeycloakProvider from "next-auth/providers/keycloak";

// Keycloak adds realm_access to the ID token profile and access token payload.
// We extend the generic Profile to describe these extra claims.
interface KeycloakProfile extends Profile {
  realm_access?: { roles?: string[] };
  sub: string;
  email: string;
  name: string;
}

// Decode a JWT payload without verification — safe here because the token
// was received directly from Keycloak, not from an untrusted source.
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return {};
  }
}

// Keycloak can be configured to include realm_access in either the ID token
// (available on `profile`) or only in the access token. We try both so the
// app works regardless of the Keycloak mapper configuration.
function extractRoles(
  profile: KeycloakProfile | undefined,
  accessToken: string | undefined
): string[] {
  if (profile?.realm_access?.roles?.length) {
    return profile.realm_access.roles;
  }
  if (accessToken) {
    const decoded = decodeJwtPayload(accessToken);
    const realmAccess = decoded.realm_access as { roles?: string[] } | undefined;
    if (realmAccess?.roles?.length) return realmAccess.roles;
  }
  return [];
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const response = await fetch(
    `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
        refresh_token: refreshToken,
      }),
    }
  );
  if (!response.ok) throw new Error("Failed to refresh token");
  return response.json();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // ── Login provider ────────────────────────────────────────────────────────
    KeycloakProvider({
      clientId:     process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer:       process.env.KEYCLOAK_ISSUER!,
    }),

    // ── Registration provider ─────────────────────────────────────────────────
    // Identical to the login provider but points the authorization URL at
    // Keycloak's /registrations endpoint so the user lands on the registration
    // form rather than the login form.
    //
    // Auth.js generates + validates state/nonce exactly as it does for the
    // regular login, so the callback succeeds without Configuration errors.
    //
    // Keycloak accepts the callback at /api/auth/callback/keycloak-register
    // because the client has redirectUris: ["http://localhost:3000/*"].
    {
      id:           "keycloak-register",
      name:         "Keycloak Register",
      type:         "oidc" as const,
      clientId:     process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer:       process.env.KEYCLOAK_ISSUER!,
      authorization: {
        url:    `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/registrations`,
        params: { scope: "openid email profile" },
      },
    },
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token: rawToken, account, profile }) {
      // Cast to our augmented JWT type — module augmentation doesn't always
      // flow through Auth.js's internal callback parameter types.
      const token = rawToken as JWT;

      // Initial sign-in: account and profile are only present on the first call
      if (account && profile) {
        const kp = profile as KeycloakProfile;
        // Explicitly set sub to the Keycloak UUID — Auth.js may populate token.sub
        // from an internal identifier rather than the OIDC sub claim.
        token.sub = kp.sub;
        token.id_token = account.id_token as string;
        token.accessToken = account.access_token as string;
        token.refreshToken = account.refresh_token as string;
        token.expiresAt = account.expires_at as number;
        token.roles = extractRoles(kp, account.access_token as string);

        // Store the resolved display name once so every session callback re-uses
        // it without hitting Keycloak again.
        // Priority:
        //   1. profile.name  — populated by our fixed oidc-usermodel-attribute-mapper
        //      that reads the "full_name" Keycloak user attribute.
        //   2. given_name + family_name  — fallback for standard Keycloak forms.
        //   3. email local-part  — last resort so the UI is never empty.
        const rawName: string | undefined =
          (kp as unknown as Record<string, string>)["name"] ||
          kp.name;
        const isEmail = (s: string) => s.includes("@");
        token.name =
          rawName && !isEmail(rawName)
            ? rawName
            : kp.email?.split("@")[0]?.replace(/[._-]/g, " ") ?? "";

        // NOTE: user-service provisioning is intentionally NOT done here.
        //
        // The Keycloak Event Listener SPI publishes a UserRegistered event to
        // Kafka on every registration. The user-service Kafka consumer creates
        // the user record from that event, which always carries the correct
        // fullName (read from the "full_name" Keycloak user attribute).
        //
        // Previously this callback called POST /users with `fullName: kp.name`.
        // That caused a NOT NULL constraint error because:
        //   - Keycloakify stores the name in the "full_name" custom attribute.
        //   - Keycloak's OIDC "name" claim is derived from firstName + lastName,
        //     which Keycloakify never sets → kp.name is null/undefined.
        //   - JSON.stringify({ fullName: undefined }) omits the key entirely,
        //     so the backend received fullName = null → DB constraint violation.
        //
        // The auth.ts callback also raced the Kafka consumer — login happens
        // immediately after registration, often before the event is processed.

        return token;
      }

      // Subsequent calls: refresh the access token if it is about to expire
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (nowInSeconds < token.expiresAt - 60) return token;

      try {
        const refreshed = await refreshAccessToken(token.refreshToken);
        return {
          ...token,
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
        };
      } catch {
        return { ...token, error: "RefreshTokenError" as const };
      }
    },

    async session({ session, token: rawToken }) {
      const token = rawToken as JWT;
      // Pre-build the Keycloak end_session URL server-side so the client
      // can use it without knowing the issuer or the raw id_token.
      const keycloakLogoutUrl = buildKeycloakLogoutUrl(
        token.id_token,
        process.env.KEYCLOAK_ISSUER,
        process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
      );
      return {
        ...session,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        keycloakLogoutUrl,
        error: token.error,
        user: {
          ...session.user,
          name: (token.name as string | undefined) ?? session.user.name ?? "",
          sub: token.sub ?? "",
          roles: token.roles ?? [],
        },
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

function buildKeycloakLogoutUrl(
  idToken: string | undefined,
  issuer: string | undefined,
  appUrl: string | undefined
): string | undefined {
  if (!idToken || !issuer) return undefined;
  const origin = (appUrl ?? "http://localhost:3000").replace(/\/$/, "");
  const url = new URL(`${issuer}/protocol/openid-connect/logout`);
  url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("post_logout_redirect_uri", origin);
  return url.toString();
}
