import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function GET(req: NextRequest) {
  return proxyToGateway(req, "/reviews");
}

export async function POST(req: NextRequest) {
  return proxyToGateway(req, "/reviews");
}
