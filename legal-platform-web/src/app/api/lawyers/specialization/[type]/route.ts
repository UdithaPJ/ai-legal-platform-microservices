import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function GET(req: NextRequest, props: { params: Promise<{ type: string }> }) {
  const { type } = await props.params;
  return proxyToGateway(req, `/lawyers/specialization/${type}`);
}
