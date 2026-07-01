export type DocumentRequestStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

export const DOCUMENT_TYPES = [
  { value: "CONTRACT", label: "Contract" },
  { value: "POWER_OF_ATTORNEY", label: "Power of Attorney" },
  { value: "LEGAL_NOTICE", label: "Legal Notice" },
  { value: "COURT_FILING", label: "Court Filing" },
  { value: "WILL", label: "Will & Testament" },
  { value: "NDA", label: "Non-Disclosure Agreement" },
  { value: "AGREEMENT", label: "General Agreement" },
  { value: "AFFIDAVIT", label: "Affidavit" },
  { value: "OTHER", label: "Other" },
] as const;

export interface DocumentFileDTO {
  id: number;
  requestId: number;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  createdAt: string;
}

export interface DocumentRequestDTO {
  id: number;
  appointmentId?: number;
  clientId: string;
  lawyerId: string;
  documentType: string;
  description?: string;
  status: DocumentRequestStatus;
  rejectionReason?: string;
  documents: DocumentFileDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequestPayload {
  appointmentId?: number;
  clientId: string;
  lawyerId: string;
  documentType: string;
  description?: string;
}

export interface UpdateDocumentStatusPayload {
  status: DocumentRequestStatus;
  rejectionReason?: string;
}
