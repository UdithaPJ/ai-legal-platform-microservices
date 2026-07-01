"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type { DocumentRequestDTO, DocumentRequestStatus } from "@/types/document";

function StatusBadge({ status }: { status: DocumentRequestStatus }) {
  const config: Record<DocumentRequestStatus, { label: string; className: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pending Review", className: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="size-3.5" /> },
    IN_PROGRESS: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200", icon: <Loader2 className="size-3.5 animate-spin" /> },
    COMPLETED: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle className="size-3.5" /> },
    REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="size-3.5" /> },
  };
  const { label, className, icon } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${className}`}>
      {icon} {label}
    </span>
  );
}

function formatDocumentType(type: string) {
  return type.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ClientDocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<DocumentRequestDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<DocumentRequestDTO>(`/documents/requests/${params.id}`);
        if (!cancelled) { setRequest(data); setError(null); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load request.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-10 text-center text-sm text-gray-500">Loading...</div>;
  }

  if (error || !request) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error ?? "Could not load this request."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/documents" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{formatDocumentType(request.documentType)}</h1>
          <p className="text-sm text-gray-500">Request #{request.id}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Document Type</p>
              <p className="mt-0.5 font-medium text-gray-800">{formatDocumentType(request.documentType)}</p>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 size-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Submitted</p>
                <p className="mt-0.5 text-sm text-gray-700">
                  {new Date(request.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {request.description && (
            <div>
              <p className="text-xs text-gray-400">Your Description</p>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {request.appointmentId && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
              <p className="text-xs text-blue-700">
                Linked to{" "}
                <Link href={`/client/appointments/${request.appointmentId}`} className="font-medium underline hover:no-underline">
                  Appointment #{request.appointmentId}
                </Link>
              </p>
            </div>
          )}

          {request.status === "REJECTED" && request.rejectionReason && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
              <p className="text-xs font-medium text-red-700">Reason for Rejection</p>
              <p className="mt-1 text-sm text-red-800">{request.rejectionReason}</p>
            </div>
          )}

          {request.status === "PENDING" && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
              <p className="text-sm text-amber-700">
                Your request is waiting for the lawyer to review and begin work.
              </p>
            </div>
          )}

          {request.status === "IN_PROGRESS" && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
              <p className="text-sm text-blue-700">
                The lawyer is currently working on your document. You will be notified when it is ready.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {request.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              Documents Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {request.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <FileText className="size-5 shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{doc.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {doc.fileSizeBytes ? formatBytes(doc.fileSizeBytes) : ""}{" "}
                    · {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`/api/documents/files/${doc.id}/download`}
                  download={doc.fileName}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  <Download className="size-3.5" /> Download
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
