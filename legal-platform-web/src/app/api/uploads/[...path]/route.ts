import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const GW = process.env.API_GATEWAY_URL ?? "http://localhost:8080";

/**
 * Transparent proxy for uploaded files stored in the user-service.
 *
 * The gateway already routes /uploads/** → user-service, and the user-service's
 * WebConfig serves the filesystem directory at that path.  This BFF route adds
 * the session token so the browser can load images via a normal <img> src
 * without the client ever seeing the access token.
 *
 * Usage:  <img src="/api/uploads/profile-pictures/filename.jpg" />
 */
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await props.params;
  const upstream = `${GW}/uploads/${path.join("/")}`;

  const res = await fetch(upstream, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse(null, { status: res.status });
  }

  const body = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
