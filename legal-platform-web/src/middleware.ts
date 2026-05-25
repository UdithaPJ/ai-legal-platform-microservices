export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/(client)/:path*",
    "/(lawyer)/:path*",
    "/(admin)/:path*",
    "/(shared)/:path*",
  ],
};
