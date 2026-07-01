import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function GET(req: NextRequest, props: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await props.params;
  return proxyToGateway(req, `/documents/requests/client/${clientId}`);
}
