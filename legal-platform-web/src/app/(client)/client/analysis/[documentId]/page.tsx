"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  LoaderCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatDateTime, normalizeRiskyClause } from "@/lib/display";
import type { DocumentStatusResponse, RiskyClause } from "@/types/analysis";

const riskColors: Record<"HIGH" | "MEDIUM" | "LOW", string> = {
  HIGH: "bg-red-50 border-red-200 text-red-700",
  MEDIUM: "bg-amber-50 border-amber-200 text-amber-700",
  LOW: "bg-blue-50 border-blue-200 text-blue-700",
};

const riskBadge: Record<"HIGH" | "MEDIUM" | "LOW", string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
};

function ClauseCard({ clause }: { clause: RiskyClause }) {
  const riskLevel = clause.risk_level ?? "MEDIUM";
  const [open, setOpen] = useState(riskLevel === "HIGH");

  return (
    <div className={`rounded-xl border p-4 ${riskColors[riskLevel]}`}>
      <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-sm font-medium">{clause.clause}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${riskBadge[riskLevel]}`}>
              {riskLevel} RISK
            </span>
          </div>
        </div>
        {open ? <ChevronUp className="mt-0.5 size-4 shrink-0" /> : <ChevronDown className="mt-0.5 size-4 shrink-0" />}
      </button>
      {open && (
        <div className="mt-3 space-y-3 pl-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Issue</p>
            <p className="mt-1 text-sm">{clause.explanation}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Recommendation</p>
            <p className="mt-1 text-sm">{clause.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalysisResultPage() {
  const params = useParams<{ documentId: string }>();
  const documentId = params.documentId;

  const [result, setResult] = useState<DocumentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    let cancelled = false;
    const intervalId: number = window.setInterval(() => {
      void loadResult();
    }, 4000);

    async function loadResult() {
      try {
        const data = await apiFetch<DocumentStatusResponse>(`/analysis/documents/${documentId}`);
        if (!cancelled) {
          setResult(data);
          setError(null);
          setLoading(false);
        }
        if (data.status !== "pending" && data.status !== "processing" && intervalId) {
          window.clearInterval(intervalId);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load analysis.");
          setLoading(false);
        }
      }
    }

    void loadResult();

    return () => {
      cancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [documentId]);

  const riskyClauses = useMemo(
    () => result?.analysis?.risky_clauses?.map(normalizeRiskyClause) ?? [],
    [result]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <LoaderCircle className="size-12 animate-spin text-blue-400" />
        <p className="mt-4 text-lg font-semibold text-gray-800">Loading analysis...</p>
      </div>
    );
  }

  // Only show the fatal error screen when there is no prior result to fall back to.
  // Transient poll errors while we already have data are shown as an inline banner instead.
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="size-12 text-red-400" />
        <p className="mt-4 text-lg font-semibold text-gray-800">Could not load this document</p>
        <p className="mt-2 text-sm text-gray-500">{error ?? "Please try again later."}</p>
        <Link href="/client/analysis" className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Back to Documents
        </Link>
      </div>
    );
  }

  if (result.status === "pending" || result.status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Clock className="size-12 animate-pulse text-blue-400" />
        <p className="mt-4 text-lg font-semibold text-gray-800">Analyzing your document...</p>
        <p className="mt-2 text-sm text-gray-500">This page refreshes automatically while the AI service is running.</p>
        {error && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
            Polling error — retrying: {error}
          </p>
        )}
      </div>
    );
  }

  if (result.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="size-12 text-red-400" />
        <p className="mt-4 text-lg font-semibold text-gray-800">Analysis failed</p>
        <p className="mt-2 text-sm text-gray-500">We could not analyze this document. Please upload it again.</p>
        <Link href="/client/analysis" className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Back to Documents
        </Link>
      </div>
    );
  }

  const highCount = riskyClauses.filter((clause) => clause.risk_level === "HIGH").length;
  const mediumCount = riskyClauses.filter((clause) => clause.risk_level === "MEDIUM").length;
  const lowCount = riskyClauses.filter((clause) => clause.risk_level === "LOW").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/analysis" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{result.filename}</h1>
          <p className="text-xs text-gray-500">Uploaded {formatDateTime(result.created_at)}</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          <CheckCircle className="size-3.5" /> Analysis complete
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "High Risk", count: highCount, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          { label: "Medium Risk", count: mediumCount, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          { label: "Low Risk", count: lowCount, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${bg}`}>
            <p className={`text-3xl font-bold ${color}`}>{count}</p>
            <p className="mt-1 text-xs text-gray-500">{label} Clauses</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" /> Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-gray-700">
          {result.analysis?.summary ?? "No summary was returned for this document."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plain English Explanation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-gray-700">
          {result.analysis?.simplified_explanation ?? "No simplified explanation was returned for this document."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-500" /> Clauses Requiring Attention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {riskyClauses.length > 0 ? (
            riskyClauses.map((clause, index) => <ClauseCard key={`${clause.clause}-${index}`} clause={clause} />)
          ) : (
            <p className="text-sm text-gray-500">No risky clauses were returned for this document.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
