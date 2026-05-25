"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, FileText, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RiskyClause = {
  clause: string;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
  explanation: string;
  recommendation: string;
};

type AnalysisResult = {
  id: string;
  filename: string;
  status: "pending" | "processing" | "completed" | "failed";
  summary?: string;
  simplified_explanation?: string;
  risky_clauses?: RiskyClause[];
  uploaded_at: string;
  completed_at?: string;
};

const mockResult: AnalysisResult = {
  id: "doc-001",
  filename: "startup_acquisition_contract.pdf",
  status: "completed",
  summary:
    "This is a standard startup acquisition agreement between Acme Corp (acquirer) and TechVenture Inc (target). The agreement covers a total consideration of $4.2M with 60% in cash and 40% in restricted stock. Key provisions include a 3-year non-compete, IP assignment, and standard representations and warranties. Several clauses require attention before signing.",
  simplified_explanation:
    "In plain terms: Acme Corp is buying TechVenture Inc for $4.2 million. You'll receive some money immediately and some company stock that you can't sell for a while. You'll also need to promise not to start a competing business for 3 years anywhere in North America, which is quite broad. The contract also says everything you created at TechVenture belongs to Acme Corp. There are some problematic sections highlighted below that your lawyer should review.",
  risky_clauses: [
    {
      clause: "Section 7.3 — Non-Compete Agreement",
      risk_level: "HIGH",
      explanation:
        "The non-compete restricts the founders from engaging in any business activity that competes with Acme Corp's entire business portfolio for 3 years across all of North America. This is unusually broad in scope, geography, and duration.",
      recommendation:
        "Negotiate to limit the scope to directly competing products, reduce the duration to 12–18 months, and restrict geography to specific states where TechVenture operated.",
    },
    {
      clause: "Section 12.1 — Intellectual Property Assignment",
      risk_level: "HIGH",
      explanation:
        "The IP assignment clause is retroactive and assigns all inventions created by founders in the 2 years prior to closing, not just during employment. This could capture personal projects unrelated to TechVenture.",
      recommendation:
        "Add a schedule that explicitly carves out personal projects not related to TechVenture's business. Request a list of excluded inventions attachment.",
    },
    {
      clause: "Section 4.8 — Indemnification Cap",
      risk_level: "MEDIUM",
      explanation:
        "The indemnification cap is set at 100% of total deal consideration with no sunset clause. Standard market terms typically cap indemnification at 10–20% with an 18-month survival period.",
      recommendation:
        "Negotiate the cap down to 15–20% of consideration and add an 18-month survival period for general representations, with a 3-year period only for fundamental representations.",
    },
    {
      clause: "Section 9.2 — Earnout Metrics",
      risk_level: "MEDIUM",
      explanation:
        "The earnout is tied to revenue targets that Acme Corp controls through pricing decisions and resource allocation. This creates a conflict of interest where the acquirer can influence whether earnout milestones are met.",
      recommendation:
        "Add protective covenants requiring the acquirer to operate the business in good faith, maintain sufficient resources, and not take actions designed to frustrate earnout achievement.",
    },
    {
      clause: "Section 15.4 — Governing Law",
      risk_level: "LOW",
      explanation:
        "The governing law is Delaware, which is standard and favourable. The dispute resolution clause requires arbitration in New York, which may be inconvenient but is common.",
      recommendation: "No action required unless you prefer a different arbitration venue.",
    },
  ],
  uploaded_at: "2026-05-24T09:15:00Z",
  completed_at: "2026-05-24T09:17:30Z",
};

const riskColors: Record<RiskyClause["risk_level"], string> = {
  HIGH: "bg-red-50 border-red-200 text-red-700",
  MEDIUM: "bg-amber-50 border-amber-200 text-amber-700",
  LOW: "bg-blue-50 border-blue-200 text-blue-700",
};

const riskBadge: Record<RiskyClause["risk_level"], string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-blue-100 text-blue-700",
};

function ClauseCard({ clause }: { clause: RiskyClause }) {
  const [open, setOpen] = useState(clause.risk_level === "HIGH");
  return (
    <div className={`rounded-xl border p-4 ${riskColors[clause.risk_level]}`}>
      <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium text-sm">{clause.clause}</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${riskBadge[clause.risk_level]}`}>
              {clause.risk_level} RISK
            </span>
          </div>
        </div>
        {open ? <ChevronUp className="size-4 shrink-0 mt-0.5" /> : <ChevronDown className="size-4 shrink-0 mt-0.5" />}
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

export default function AnalysisResultPage(props: { params: Promise<{ documentId: string }> }) {
  const [result] = useState<AnalysisResult>(mockResult);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (result.status === "pending" || result.status === "processing") {
      setPolling(true);
    }
  }, [result.status]);

  if (polling) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Clock className="size-12 animate-pulse text-blue-400" />
        <p className="mt-4 text-lg font-semibold text-gray-800">Analysing your document…</p>
        <p className="mt-2 text-sm text-gray-500">This usually takes 30–60 seconds. This page will update automatically.</p>
      </div>
    );
  }

  if (result.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="size-12 text-red-400" />
        <p className="mt-4 text-lg font-semibold text-gray-800">Analysis failed</p>
        <p className="mt-2 text-sm text-gray-500">We couldn't analyse this document. Please try uploading it again.</p>
        <Link href="/client/analysis" className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Back to Documents
        </Link>
      </div>
    );
  }

  const highCount = result.risky_clauses?.filter((c) => c.risk_level === "HIGH").length ?? 0;
  const mediumCount = result.risky_clauses?.filter((c) => c.risk_level === "MEDIUM").length ?? 0;
  const lowCount = result.risky_clauses?.filter((c) => c.risk_level === "LOW").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/analysis" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{result.filename}</h1>
          <p className="text-xs text-gray-500">
            Analysed {result.completed_at ? new Date(result.completed_at).toLocaleString() : ""}
          </p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          <CheckCircle className="size-3.5" /> Analysis complete
        </span>
      </div>

      {/* Risk summary bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "High Risk", count: highCount, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          { label: "Medium Risk", count: mediumCount, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          { label: "Low Risk", count: lowCount, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 text-center ${bg}`}>
            <p className={`text-3xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-1">{label} Clauses</p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" /> Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-gray-700">{result.summary}</CardContent>
      </Card>

      {/* Plain English */}
      <Card>
        <CardHeader>
          <CardTitle>Plain English Explanation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-gray-700">{result.simplified_explanation}</CardContent>
      </Card>

      {/* Risky clauses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-red-500" /> Clauses Requiring Attention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.risky_clauses?.map((clause) => (
            <ClauseCard key={clause.clause} clause={clause} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
