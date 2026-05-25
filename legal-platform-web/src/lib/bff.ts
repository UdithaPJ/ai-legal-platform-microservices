import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const GW = process.env.API_GATEWAY_URL ?? "http://localhost:8080";

/** Proxy a request to the gateway, injecting the session's access token. */
export async function proxyToGateway(
  request: NextRequest,
  path: string,
  extraHeaders: Record<string, string> = {}
): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = `${GW}${path}`;
  const isMultipart = request.headers.get("content-type")?.includes("multipart");

  const init: RequestInit = {
    method: request.method,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      ...(!isMultipart ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
    },
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = isMultipart ? await request.formData() as unknown as BodyInit : await request.text();
  }

  const res = await fetch(url, init);
  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "application/json";

  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": contentType },
  });
}

