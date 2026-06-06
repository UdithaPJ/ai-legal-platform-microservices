import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    refreshToken: string;
    keycloakLogoutUrl?: string;
    error?: "RefreshTokenError";
    user: {
      sub: string;
      roles: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id_token: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    roles: string[];
    error?: "RefreshTokenError";
  }
}
