"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, FilePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { DOCUMENT_TYPES } from "@/types/document";
import type { CreateDocumentRequestPayload, DocumentRequestDTO } from "@/types/document";
import type { LawyerResponseDTO } from "@/types/lawyer";
import type { UserResponse } from "@/types/user";

type LawyerWithName = LawyerResponseDTO & { fullName: string };

export default function NewDocumentRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const prefilledLawyerId = searchParams.get("lawyerId") ?? "";
  const prefilledAppointmentId = searchParams.get("appointmentId") ?? "";

  const [lawyers, setLawyers] = useState<LawyerWithName[]>([]);
  const [lawyerId, setLawyerId] = useState(prefilledLawyerId);
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profiles = await apiFetch<LawyerResponseDTO[]>("/lawyers");
        const withNames = await Promise.all(
          profiles.map(async (l) => {
            try {
              const user = await apiFetch<UserResponse>(`/users/${l.userId}`);
              return { ...l, fullName: user.fullName };
            } catch {
              return { ...l, fullName: String(l.userId) };
            }
          })
        );
        setLawyers(withNames);
      } catch {
        setLawyers([]);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user.sub || !lawyerId || !documentType) return;

    const lawyer = lawyers.find((l) => l.userId === lawyerId || String(l.id) === lawyerId);

    const payload: CreateDocumentRequestPayload = {
      clientId: session.user.sub,
      lawyerId: lawyer?.userId ?? lawyerId,
      documentType,
      description: description.trim() || undefined,
      appointmentId: prefilledAppointmentId ? Number(prefilledAppointmentId) : undefined,
    };

    try {
      setSubmitting(true);
      setError(null);
      const created = await apiFetch<DocumentRequestDTO>("/documents/requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/client/documents/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/documents" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Request a Document</h1>
          <p className="text-sm text-gray-500">Ask your lawyer to draft a legal document</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {prefilledAppointmentId && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                This request will be linked to Appointment #{prefilledAppointmentId}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Select Lawyer <span className="text-red-500">*</span>
              </label>
              {prefilledLawyerId ? (
                <input
                  type="text"
                  readOnly
                  value={lawyers.find((l) => l.userId === prefilledLawyerId)?.fullName ?? prefilledLawyerId}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
                />
              ) : (
                <select
                  value={lawyerId}
                  onChange={(e) => setLawyerId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Select a lawyer...</option>
                  {lawyers.map((l) => (
                    <option key={l.id} value={l.userId}>
                      {l.fullName}
                      {l.specializations?.length ? ` — ${l.specializations[0].replaceAll("_", " ")}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="">Select document type...</option>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what you need — parties involved, specific terms, context, or any other details that will help your lawyer..."
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting || !lawyerId || !documentType}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <FilePlus className="size-4" />
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
              <Link
                href="/client/documents"
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
