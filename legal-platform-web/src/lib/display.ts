import type { RiskyClause } from "@/types/analysis";
import type { Specialization } from "@/types/lawyer";

const specializationLabels: Record<Specialization, string> = {
  CRIMINAL_LAW: "Criminal Law",
  CIVIL_LAW: "Civil Law",
  CORPORATE_LAW: "Corporate Law",
  FAMILY_LAW: "Family Law",
  INTELLECTUAL_PROPERTY: "Intellectual Property",
  LABOR_LAW: "Labor Law",
  REAL_ESTATE_LAW: "Real Estate Law",
  IMMIGRATION_LAW: "Immigration Law",
  TAX_LAW: "Tax Law",
  CONSTITUTIONAL_LAW: "Constitutional Law",
};

/**
 * Converts a profilePictureUrl stored in the user-service
 * (e.g. "/uploads/profile-pictures/abc.jpg") to the BFF-served URL
 * (e.g. "/api/uploads/profile-pictures/abc.jpg").
 * Returns null when no picture is set.
 */
export function toAvatarUrl(profilePictureUrl: string | null | undefined): string | null {
  if (!profilePictureUrl) return null;
  // The gateway serves uploads under /uploads/..., the BFF mirrors it at /api/uploads/...
  return profilePictureUrl.startsWith("/api") ? profilePictureUrl : `/api${profilePictureUrl}`;
}

export function formatSpecialization(value: Specialization): string {
  return specializationLabels[value] ?? value.replaceAll("_", " ");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function formatCurrency(value?: number | null): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "Pending confirmation";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateOnly(value?: string | null): string {
  if (!value) return "Pending confirmation";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatTimeOnly(value?: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeTimestamp(value: string): string {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / (1000 * 60));
  const hours = Math.round(absMs / (1000 * 60 * 60));
  const days = Math.round(absMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    const amount = Math.max(minutes, 1);
    return diffMs <= 0 ? `${amount}m ago` : `in ${amount}m`;
  }
  if (hours < 24) {
    return diffMs <= 0 ? `${hours}h ago` : `in ${hours}h`;
  }
  return diffMs <= 0 ? `${days}d ago` : `in ${days}d`;
}

export function normalizeRiskyClause(clause: unknown, index: number): RiskyClause {
  if (!clause || typeof clause !== "object") {
    return {
      clause: `Clause ${index + 1}`,
      risk_level: "MEDIUM",
      explanation: typeof clause === "string" ? clause : "Requires manual legal review.",
      recommendation: "Discuss this clause with a qualified lawyer before signing.",
    };
  }

  const candidate = clause as RiskyClause;
  return {
    clause: candidate.clause ?? `Clause ${index + 1}`,
    risk_level:
      candidate.risk_level === "HIGH" ||
      candidate.risk_level === "MEDIUM" ||
      candidate.risk_level === "LOW"
        ? candidate.risk_level
        : "MEDIUM",
    explanation: candidate.explanation ?? "Requires manual legal review.",
    recommendation:
      candidate.recommendation ?? "Discuss this clause with a qualified lawyer before signing.",
  };
}
