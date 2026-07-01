"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CheckCircle, Clock, FileText, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type { DocumentRequestDTO, DocumentRequestStatus } from "@/types/document";

function StatusBadge({ status }: { status: DocumentRequestStatus }) {
  const config: Record<DocumentRequestStatus, { label: string; className: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pending", className: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="size-3" /> },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200", icon: <Loader2 className="size-3 animate-spin" /> },
    COMPLETED: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle className="size-3" /> },
    REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="size-3" /> },
  };
  const { label, className, icon } = config[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {icon} {label}
    </span>
  );
}

function formatDocumentType(type: string) {
  return type.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LawyerDocumentsPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<DocumentRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  useEffect(() => {
    if (status !== "authenticated" || !session.user.sub) {
      if (status !== "loading") setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<DocumentRequestDTO[]>(`/documents/requests/lawyer/${session.user.sub}`);
        if (!cancelled) { setRequests(data); setError(null); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load document requests.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [session?.user.sub, status]);

  const pending = requests.filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS");
  const displayed = activeTab === "pending" ? pending : requests;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Document Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">Clients requesting you to draft legal documents</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        {(["pending", "all"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "pending" ? `Active (${pending.length})` : `All (${requests.length})`}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white px-4 py-10 text-center text-sm text-gray-500">Loading...</div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border bg-white px-6 py-12 text-center">
          <FileText className="mx-auto mb-3 size-10 text-gray-300" />
          <p className="font-medium text-gray-700">
            {activeTab === "pending" ? "No active requests" : "No requests yet"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === "pending" ? "All document requests have been handled." : "Clients will send document drafting requests here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((req) => (
            <Link key={req.id} href={`/lawyer/documents/${req.id}`}>
              <Card className="cursor-pointer transition-all hover:ring-1 hover:ring-blue-300">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{formatDocumentType(req.documentType)}</p>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                          {req.description || "No additional details provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={req.status} />
                      <span className="text-xs text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  {req.appointmentId && (
                    <p className="mt-2 text-xs text-gray-400">Linked to Appointment #{req.appointmentId}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
