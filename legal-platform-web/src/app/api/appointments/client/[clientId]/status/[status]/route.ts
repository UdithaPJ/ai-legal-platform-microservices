import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ clientId: string; status: string }> }
) {
  const { clientId, status } = await props.params;
  return proxyToGateway(req, `/appointments/client/${clientId}/status/${status}`);
}
