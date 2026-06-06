import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const GW = process.env.API_GATEWAY_URL ?? "http://localhost:8080";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${GW}/analysis/documents`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-User-Id": session.user.sub,
    },
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const res = await fetch(`${GW}/analysis/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      // X-User-Id required by AI service — injected server-side, never from client
      "X-User-Id": session.user.sub,
      // Do NOT set Content-Type — let fetch set the boundary for multipart
    },
    body: formData,
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
