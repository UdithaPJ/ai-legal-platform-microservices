"use client";

import { useEffect, useRef, useState } from "react";
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
  Upload,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type { DocumentRequestDTO, DocumentRequestStatus, UpdateDocumentStatusPayload } from "@/types/document";

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

export default function LawyerDocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [request, setRequest] = useState<DocumentRequestDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  async function updateStatus(status: DocumentRequestStatus, reason?: string) {
    if (!request) return;
    try {
      setSubmitting(true);
      setError(null);
      const payload: UpdateDocumentStatusPayload = { status, rejectionReason: reason };
      const updated = await apiFetch<DocumentRequestDTO>(`/documents/requests/${request.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setRequest(updated);
      setShowRejectForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload() {
    if (!request || !selectedFile) return;
    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const updated = await apiFetch<DocumentRequestDTO>(`/documents/requests/${request.id}/upload`, {
        method: "POST",
        body: formData,
      });
      setRequest(updated);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-10 text-center text-sm text-gray-500">Loading...</div>;
  }

  if (error && !request) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!request) return null;

  const canAct = request.status === "PENDING" || request.status === "IN_PROGRESS";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/lawyer/documents" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{formatDocumentType(request.documentType)}</h1>
          <p className="text-sm text-gray-500">Request #{request.id}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

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
                <p className="text-xs text-gray-400">Requested</p>
                <p className="mt-0.5 text-sm text-gray-700">
                  {new Date(request.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {request.description ? (
            <div>
              <p className="text-xs text-gray-400">Client&apos;s Description</p>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No description provided by client.</p>
          )}

          {request.appointmentId && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
              <p className="text-xs text-blue-700">
                Linked to{" "}
                <Link href={`/lawyer/appointments/${request.appointmentId}`} className="font-medium underline hover:no-underline">
                  Appointment #{request.appointmentId}
                </Link>
              </p>
            </div>
          )}

          {request.status === "REJECTED" && request.rejectionReason && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
              <p className="text-xs font-medium text-red-700">Your Rejection Reason</p>
              <p className="mt-1 text-sm text-red-800">{request.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canAct && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Completed Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Prepare the document offline, then upload the final version here. Uploading will automatically mark the request as completed and notify the client.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <Upload className="mb-2 size-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">
                {selectedFile ? selectedFile.name : "Click to select a file"}
              </p>
              {selectedFile ? (
                <p className="mt-1 text-xs text-gray-400">{formatBytes(selectedFile.size)}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">PDF, DOCX, or any document format</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => void handleUpload()}
                disabled={!selectedFile || uploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Upload className="size-4" />
                {uploading ? "Uploading..." : "Upload & Complete Request"}
              </button>
              {request.status === "PENDING" && (
                <button
                  onClick={() => void updateStatus("IN_PROGRESS")}
                  disabled={submitting}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Mark In Progress"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {canAct && !showRejectForm && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowRejectForm(true)}
            className="text-sm text-red-500 hover:text-red-700 hover:underline"
          >
            Unable to fulfil this request? Decline it
          </button>
        </div>
      )}

      {showRejectForm && (
        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-red-700">Decline Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason for declining <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Explain why you cannot fulfil this request..."
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-red-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void updateStatus("REJECTED", rejectionReason)}
                disabled={!rejectionReason.trim() || submitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Confirm Decline"}
              </button>
              <button
                onClick={() => { setShowRejectForm(false); setRejectionReason(""); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {request.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              Uploaded Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {request.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <FileText className="size-5 shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{doc.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {doc.fileSizeBytes ? formatBytes(doc.fileSizeBytes) : ""}
                    {" · "}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`/api/documents/files/${doc.id}/download`}
                  download={doc.fileName}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
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
