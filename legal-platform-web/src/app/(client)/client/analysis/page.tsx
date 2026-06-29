"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock, FileText, LoaderCircle, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime } from "@/lib/display";
import type { DocumentStatus, DocumentStatusResponse, DocumentUploadResponse } from "@/types/analysis";

const statusIcon: Record<DocumentStatus, React.ReactNode> = {
  completed: <CheckCircle className="size-4 text-green-500" />,
  processing: <Clock className="size-4 text-orange-500" />,
  pending: <LoaderCircle className="size-4 animate-spin text-blue-500" />,
  failed: <AlertTriangle className="size-4 text-red-500" />,
};

const statusLabel: Record<DocumentStatus, string> = {
  completed: "Completed",
  processing: "Processing...",
  pending: "Queued...",
  failed: "Failed",
};

export default function DocumentAnalysisPage() {
  const [dragging, setDragging] = useState(false);
  const [docs, setDocs] = useState<DocumentStatusResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const hasInFlightDocuments = useMemo(
    () => docs.some((doc) => doc.status === "pending" || doc.status === "processing"),
    [docs]
  );

  async function loadDocuments() {
    const data = await apiFetch<DocumentStatusResponse[]>("/analysis/documents");
    setPollError(null);
    setDocs(
      [...data].sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      )
    );
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadDocuments();
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load documents.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasInFlightDocuments) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = window.setInterval(() => {
      loadDocuments().catch((err) => {
        setPollError(err instanceof Error ? err.message : "Failed to refresh status.");
      });
    }, 4000);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [hasInFlightDocuments]);

  async function uploadFile(file: File) {
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const created = await apiFetch<DocumentUploadResponse>("/analysis/documents", {
        method: "POST",
        body: formData,
      });

      setDocs((prev) => [
        {
          id: created.id,
          filename: created.filename,
          status: created.status,
          created_at: created.created_at,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      void uploadFile(file);
    }
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 transition-colors ${
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
        }`}
      >
        <Upload className="mb-3 size-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">Drop a PDF or DOCX here</p>
        <p className="mt-1 text-xs text-gray-400">or</p>
        <label className="mt-3 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {uploading ? "Uploading..." : "Browse Files"}
          <input
            type="file"
            accept=".pdf,.docx"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void uploadFile(file);
              }
              e.currentTarget.value = "";
            }}
          />
        </label>
        <p className="mt-3 text-xs text-gray-400">Supported: PDF, DOCX</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {pollError && !error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Status refresh failed — retrying: {pollError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading documents...</div>
          ) : docs.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No documents uploaded yet.
            </div>
          ) : (
            docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-3">
                <FileText className="size-5 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{doc.filename}</p>
                  <p className="text-xs text-gray-400">
                    Uploaded {formatDateTime(doc.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusIcon[doc.status]}
                  <span className="text-xs text-gray-500">{statusLabel[doc.status]}</span>
                </div>
                {doc.status === "completed" && (
                  <Link
                    href={`/client/analysis/${doc.id}`}
                    className="rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                  >
                    View Results
                  </Link>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
