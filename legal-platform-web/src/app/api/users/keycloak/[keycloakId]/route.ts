import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function GET(req: NextRequest, props: { params: Promise<{ keycloakId: string }> }) {
  const { keycloakId } = await props.params;
  return proxyToGateway(req, `/users/keycloak/${keycloakId}`);
}
