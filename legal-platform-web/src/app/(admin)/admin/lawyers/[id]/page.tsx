"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, XCircle, ShieldOff,
  FileText, MapPin, DollarSign, Briefcase, Star,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatSpecialization } from "@/lib/display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LawyerResponseDTO, LawyerDocument, VerificationStatus } from "@/types/lawyer";
import type { UserResponse } from "@/types/user";

const STATUS_CONFIG: Record<VerificationStatus, { label: string; className: string }> = {
  PENDING_ONBOARDING:  { label: "Onboarding",    className: "bg-gray-100 text-gray-700"     },
  PENDING_VERIFICATION:{ label: "Pending Review", className: "bg-amber-100 text-amber-700"  },
  VERIFIED:            { label: "Verified",       className: "bg-green-100 text-green-700"  },
  REJECTED:            { label: "Rejected",       className: "bg-red-100 text-red-700"      },
  SUSPENDED:           { label: "Suspended",      className: "bg-orange-100 text-orange-700"},
};

const DOC_LABELS: Record<string, string> = {
  BAR_COUNCIL_CERTIFICATE: "Bar Council Certificate",
  NATIONAL_ID:             "National ID",
  PRACTICING_CERTIFICATE:  "Practicing Certificate",
};

export default function AdminLawyerDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [lawyer,    setLawyer]    = useState<LawyerResponseDTO | null>(null);
  const [user,      setUser]      = useState<UserResponse | null>(null);
  const [documents, setDocuments] = useState<LawyerDocument[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [acting,    setActing]    = useState<"approve" | "reject" | "suspend" | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [lawyerData, docsData] = await Promise.all([
          apiFetch<LawyerResponseDTO>(`/admin/lawyers/${id}`),
          apiFetch<LawyerDocument[]>(`/admin/lawyers/${id}/documents`).catch(() => [] as LawyerDocument[]),
        ]);
        setLawyer(lawyerData);
        setDocuments(docsData);
        // Fetch user info for name/email
        if (lawyerData.userId) {
          const userData = await apiFetch<UserResponse>(`/users/${lawyerData.userId}`).catch(() => null);
          setUser(userData);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load lawyer profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleDecision(action: "approve" | "reject" | "suspend") {
    setActing(action);
    setError(null);
    try {
      const updated = await apiFetch<LawyerResponseDTO>(`/admin/lawyers/${id}/${action}`, {
        method: "POST",
      });
      setLawyer(updated);
      const labels = { approve: "Approved", reject: "Rejected", suspend: "Suspended" };
      setActionDone(`${labels[action]} successfully.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action} failed.`);
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-gray-400">Loading lawyer profile…</div>
    );
  }

  if (error && !lawyer) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!lawyer) return null;

  const status = lawyer.verificationStatus ?? "PENDING_ONBOARDING";
  const statusCfg = STATUS_CONFIG[status];
  const fullName = user?.fullName ?? "Unknown Lawyer";
  const email    = user?.email    ?? "";

  const isPending  = status === "PENDING_VERIFICATION";
  const isVerified = status === "VERIFIED";
  const isRejected = status === "REJECTED";

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <Link href="/admin/lawyers" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusCfg.className}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Action result banner */}
      {actionDone && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {actionDone}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Decision actions */}
      {(isPending || isVerified || isRejected) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Admin Decision</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {(isPending || isRejected) && (
              <button
                onClick={() => void handleDecision("approve")}
                disabled={!!acting}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="size-4" />
                {acting === "approve" ? "Approving…" : "Approve"}
              </button>
            )}
            {isPending && (
              <button
                onClick={() => void handleDecision("reject")}
                disabled={!!acting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="size-4" />
                {acting === "reject" ? "Rejecting…" : "Reject"}
              </button>
            )}
            {isVerified && (
              <button
                onClick={() => void handleDecision("suspend")}
                disabled={!!acting}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <ShieldOff className="size-4" />
                {acting === "suspend" ? "Suspending…" : "Suspend"}
              </button>
            )}
            <p className="self-center text-xs text-gray-400">
              {isPending  && "Approve to make this lawyer visible to clients, or reject to request corrections."}
              {isVerified && "Suspend will immediately hide this lawyer from clients."}
              {isRejected && "Re-approve if the lawyer has corrected their profile."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Briefcase className="size-4" /> Professional Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Bar No."     value={lawyer.barRegistrationNumber ?? "—"} mono />
            <Row label="Experience"  value={lawyer.yearsOfExperience != null ? `${lawyer.yearsOfExperience} year(s)` : "—"} />
            <Row label="Location"    value={lawyer.location ?? "—"} icon={<MapPin className="size-3.5 text-gray-400" />} />
            <Row label="Fee"         value={lawyer.consultationFee != null ? `${formatCurrency(lawyer.consultationFee)}/hr` : "—"} icon={<DollarSign className="size-3.5 text-gray-400" />} />
            <Row label="Rating"      value={lawyer.averageRating != null ? `${lawyer.averageRating} (${lawyer.reviewCount} reviews)` : "No reviews"} icon={<Star className="size-3.5 text-gray-400" />} />
            {lawyer.bio && (
              <div className="pt-1">
                <p className="mb-1 text-xs font-medium text-gray-500">Bio</p>
                <p className="rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-700">
                  {lawyer.bio}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Specializations</CardTitle>
          </CardHeader>
          <CardContent>
            {(lawyer.specializations ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">None set yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {lawyer.specializations.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {formatSpecialization(s)}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4" /> Verification Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 shrink-0 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {DOC_LABELS[doc.documentType] ?? doc.documentType}
                      </p>
                      <p className="text-xs text-gray-400">
                        Uploaded {doc.uploadedAt
                          ? new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-gray-400">
        Profile created: {lawyer.createdAt ? new Date(lawyer.createdAt).toLocaleString() : "—"} ·
        Last updated: {lawyer.updatedAt ? new Date(lawyer.updatedAt).toLocaleString() : "—"}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-24 shrink-0 text-xs font-medium text-gray-500">{label}</span>
      <span className={`flex items-center gap-1 text-gray-800 ${mono ? "font-mono text-xs" : ""}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}
