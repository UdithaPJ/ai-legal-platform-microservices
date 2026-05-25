import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return proxyToGateway(req, `/users/${id}/profile-picture`);
}
