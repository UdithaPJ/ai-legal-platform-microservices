import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // Unauthenticated — send to home where the sign-in prompt lives
  if (!session) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  const roles: string[] = session.user.roles ?? [];

  if (pathname.startsWith("/admin") && !roles.includes("ADMIN")) {
    return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
  }

  if (pathname.startsWith("/lawyer") && !roles.includes("LAWYER")) {
    return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
  }

  if (pathname.startsWith("/client") && !roles.includes("CLIENT")) {
    return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Match the actual URL paths for each role group.
  // Route group folders like (client) do not appear in the URL.
  matcher: ["/client/:path*", "/lawyer/:path*", "/admin/:path*"],
};
