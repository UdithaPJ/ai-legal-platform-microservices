export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface RiskyClause {
  clause?: string;
  risk_level?: "HIGH" | "MEDIUM" | "LOW";
  explanation?: string;
  recommendation?: string;
}

export interface AnalysisResult {
  summary?: string | null;
  risky_clauses?: RiskyClause[] | null;
  simplified_explanation?: string | null;
}

export interface DocumentStatusResponse {
  id: string;
  filename: string;
  status: DocumentStatus;
  analysis?: AnalysisResult | null;
  created_at: string;
}

export interface DocumentUploadResponse {
  id: string;
  status: DocumentStatus;
  filename: string;
  created_at: string;
}
