import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

async function refreshAccessToken(refreshToken: string) {
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
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account, profile }: any) {
      if (account && profile) {
        const realmAccess = profile?.realm_access as { roles?: string[] } | undefined;
        token.accessToken = account.access_token as string;
        token.refreshToken = account.refresh_token as string;
        token.expiresAt = account.expires_at as number;
        token.roles = realmAccess?.roles ?? [];

        // Provision user in user-service on first login
        try {
          const primaryRole = token.roles.includes("ADMIN")
            ? "ADMIN"
            : token.roles.includes("LAWYER")
            ? "LAWYER"
            : "CLIENT";
          await fetch(`${process.env.API_GATEWAY_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              keycloakId: profile.sub,
              email: profile.email,
              fullName: profile.name,
              role: primaryRole,
            }),
          });
        } catch {
          // User may already exist — ignore errors
        }
        return token;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (nowInSeconds < (token.expiresAt as number) - 60) return token;

      // Refresh expired token
      try {
        const refreshed = await refreshAccessToken(token.refreshToken as string);
        return {
          ...token,
          accessToken: refreshed.access_token as string,
          refreshToken: (refreshed.refresh_token as string) ?? token.refreshToken,
          expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in as number),
        };
      } catch {
        return { ...token, error: "RefreshTokenError" as const };
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.error = token.error;
      session.user.sub = token.sub as string;
      session.user.roles = (token.roles as string[]) ?? [];
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});
