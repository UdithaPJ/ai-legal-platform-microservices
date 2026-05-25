export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface AnalysisResult {
  summary: string;
  risky_clauses: string[];
  simplified_explanation: string;
}

export interface DocumentStatusResponse {
  id: string;
  filename: string;
  status: DocumentStatus;
  user_id?: string;
  analysis?: AnalysisResult;
  created_at: string;
}

export interface DocumentUploadResponse {
  id: string;
  status: DocumentStatus;
  filename: string;
  user_id?: string;
}
