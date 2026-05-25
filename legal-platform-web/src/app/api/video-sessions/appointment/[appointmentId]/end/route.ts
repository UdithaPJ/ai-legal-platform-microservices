import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function POST(req: NextRequest, props: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await props.params;
  return proxyToGateway(req, `/video-sessions/appointment/${appointmentId}/end`);
}
