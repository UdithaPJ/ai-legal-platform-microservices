"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FilePlus, FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type { DocumentRequestDTO, DocumentRequestStatus } from "@/types/document";

function StatusBadge({ status }: { status: DocumentRequestStatus }) {
  const config: Record<DocumentRequestStatus, { label: string; className: string; icon: React.ReactNode }> = {
    PENDING: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock className="size-3" />,
    },
    IN_PROGRESS: {
      label: "In Progress",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Loader2 className="size-3 animate-spin" />,
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle className="size-3" />,
    },
    REJECTED: {
      label: "Rejected",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: <XCircle className="size-3" />,
    },
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

export default function ClientDocumentsPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<DocumentRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session.user.sub) {
      if (status !== "loading") setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<DocumentRequestDTO[]>(`/documents/requests/client/${session.user.sub}`);
        if (!cancelled) {
          setRequests(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load document requests.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [session?.user.sub, status]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Document Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Request lawyers to draft legal documents on your behalf</p>
        </div>
        <Link
          href="/client/documents/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <FilePlus className="size-4" />
          New Request
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white px-4 py-10 text-center text-sm text-gray-500">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border bg-white px-6 py-12 text-center">
          <FileText className="mx-auto mb-3 size-10 text-gray-300" />
          <p className="font-medium text-gray-700">No document requests yet</p>
          <p className="mt-1 text-sm text-gray-500">Request a lawyer to draft a legal document for you.</p>
          <Link
            href="/client/documents/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FilePlus className="size-4" /> Create your first request
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Link key={req.id} href={`/client/documents/${req.id}`}>
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
                          {req.description || "No additional details"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={req.status} />
                      {req.documents.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {req.documents.length} file{req.documents.length !== 1 ? "s" : ""}
                        </span>
                      )}
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
