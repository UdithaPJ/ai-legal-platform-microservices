import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function GET(req: NextRequest, props: { params: Promise<{ lawyerId: string }> }) {
  const { lawyerId } = await props.params;
  return proxyToGateway(req, `/reviews/lawyer/${lawyerId}/summary`);
}
