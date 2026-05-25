import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function GET(req: NextRequest, props: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await props.params;
  return proxyToGateway(req, `/messages/${conversationId}`);
}
