import { NextRequest } from "next/server";
import { proxyToGateway } from "@/lib/bff";

export async function GET(req: NextRequest, props: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await props.params;
  return proxyToGateway(req, `/documents/files/${fileId}/download`);
}
