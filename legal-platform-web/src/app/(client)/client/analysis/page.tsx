"use client";

import { useState } from "react";
import { FileText, Upload, CheckCircle, Clock, AlertTriangle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DocStatus = "completed" | "processing" | "failed";

const existingDocs: { id: string; name: string; status: DocStatus; uploadedAt: string }[] = [
  { id: "doc-1", name: "Employment_Contract_2026.pdf", status: "completed", uploadedAt: "May 20, 2026" },
  { id: "doc-2", name: "NDA_TechCorp.docx", status: "completed", uploadedAt: "May 15, 2026" },
  { id: "doc-3", name: "Lease_Agreement_Draft.pdf", status: "processing", uploadedAt: "May 25, 2026" },
];

const statusIcon: Record<DocStatus, React.ReactNode> = {
  completed: <CheckCircle className="size-4 text-green-500" />,
  processing: <Clock className="size-4 text-orange-500" />,
  failed: <AlertTriangle className="size-4 text-red-500" />,
};

const statusLabel: Record<DocStatus, string> = {
  completed: "Completed",
  processing: "Processing…",
  failed: "Failed",
};

export default function DocumentAnalysisPage() {
  const [dragging, setDragging] = useState(false);
  const [docs, setDocs] = useState(existingDocs);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setDocs((prev) => [
        { id: `doc-${Date.now()}`, name: file.name, status: "processing", uploadedAt: "Just now" },
        ...prev,
      ]);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
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
          Browse Files
          <input
            type="file"
            accept=".pdf,.docx"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setDocs((prev) => [
                  { id: `doc-${Date.now()}`, name: file.name, status: "processing", uploadedAt: "Just now" },
                  ...prev,
                ]);
              }
            }}
          />
        </label>
        <p className="mt-3 text-xs text-gray-400">Supported: PDF, DOCX · Max 20 MB</p>
      </div>

      {/* Document list */}
      <Card>
        <CardHeader><CardTitle>Your Documents</CardTitle></CardHeader>
        <CardContent className="divide-y divide-gray-100">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 py-3">
              <FileText className="size-5 shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{doc.name}</p>
                <p className="text-xs text-gray-400">Uploaded {doc.uploadedAt}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {statusIcon[doc.status]}
                <span className="text-xs text-gray-500">{statusLabel[doc.status]}</span>
              </div>
              {doc.status === "completed" && (
                <a
                  href={`/client/analysis/${doc.id}`}
                  className="rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                >
                  View Results
                </a>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
