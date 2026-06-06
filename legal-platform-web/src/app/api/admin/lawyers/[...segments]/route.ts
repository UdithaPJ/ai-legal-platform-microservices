import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

type Ctx = { params: Promise<{ segments: string[] }> };

function path(segments: string[]) {
  return `/admin/lawyers/${segments.join("/")}`;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { segments } = await params;
  return proxyToGateway(req, path(segments));
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { segments } = await params;
  return proxyToGateway(req, path(segments));
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { segments } = await params;
  return proxyToGateway(req, path(segments));
}
