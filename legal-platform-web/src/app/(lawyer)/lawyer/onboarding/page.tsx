"use client";

import { useState } from "react";
import { useSession }  from "next-auth/react";
import { useRouter }   from "next/navigation";
import {
  Briefcase, BookOpen, DollarSign, FileUp, Send, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  "FAMILY_LAW",
  "CRIMINAL_LAW",
  "REAL_ESTATE_LAW",
  "CORPORATE_LAW",
  "LABOR_LAW",
  "TAX_LAW",
  "IMMIGRATION_LAW",
  "INTELLECTUAL_PROPERTY",
  "CIVIL_LAW",
  "CONSTITUTIONAL_LAW",
] as const;

type Specialization = (typeof SPECIALIZATIONS)[number];

const DOCUMENT_TYPES = [
  { key: "BAR_COUNCIL_CERTIFICATE", label: "Bar Council Certificate" },
  { key: "NATIONAL_ID",             label: "National ID" },
  { key: "PRACTICING_CERTIFICATE",  label: "Practicing Certificate" },
] as const;

interface UploadedDoc { documentType: string; fileUrl: string }

// ── Wizard steps config ───────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Professional Info", icon: Briefcase },
  { id: 2, label: "Practice Areas",   icon: BookOpen  },
  { id: 3, label: "Fees & Location",  icon: DollarSign },
  { id: 4, label: "Documents",        icon: FileUp    },
  { id: 5, label: "Review & Submit",  icon: Send      },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function LawyerOnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.sub;

  const [step,    setStep]    = useState(1);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Step 1
  const [yearsOfExperience, setYears] = useState("");
  const [bio,                setBio]  = useState("");

  // Step 2
  const [specializations, setSpecializations] = useState<Specialization[]>([]);

  // Step 3
  const [consultationFee, setFee]      = useState("");
  const [location,        setLocation] = useState("");

  // Step 4
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [docType,   setDocType]   = useState<string>(DOCUMENT_TYPES[0].key);
  const [docUrl,    setDocUrl]    = useState("");

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function toggleSpecialization(s: Specialization) {
    setSpecializations((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function addDocument() {
    if (!docUrl.trim()) return;
    setDocuments((prev) => [
      ...prev.filter((d) => d.documentType !== docType),
      { documentType: docType, fileUrl: docUrl.trim() },
    ]);
    setDocUrl("");
  }

  async function callApi(path: string, body: unknown) {
    if (!userId) throw new Error("Not authenticated");
    return apiFetch(`/lawyers/onboarding/${userId}${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async function postApi(path: string, body: unknown) {
    if (!userId) throw new Error("Not authenticated");
    return apiFetch(`/lawyers/onboarding/${userId}${path}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // ── Step submission handlers ─────────────────────────────────────────────

  async function handleStep1() {
    if (!yearsOfExperience || !bio.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSaving(true); setError(null);
    try {
      await callApi("/step1", {
        yearsOfExperience: parseInt(yearsOfExperience, 10),
        bio,
      });
      setStep(2);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  }

  async function handleStep2() {
    if (specializations.length === 0) {
      setError("Select at least one practice area.");
      return;
    }
    setSaving(true); setError(null);
    try {
      await callApi("/step2", { specializations });
      setStep(3);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  }

  async function handleStep3() {
    if (!consultationFee || !location.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setSaving(true); setError(null);
    try {
      await callApi("/step3", {
        consultationFee: parseFloat(consultationFee),
        location,
      });
      setStep(4);
    } catch { setError("Failed to save. Please try again."); }
    finally { setSaving(false); }
  }

  async function handleStep4() {
    if (documents.length === 0) {
      setError("Upload at least one document.");
      return;
    }
    setSaving(true); setError(null);
    try {
      for (const doc of documents) {
        await postApi("/documents", doc);
      }
      setStep(5);
    } catch { setError("Failed to save documents. Please try again."); }
    finally { setSaving(false); }
  }

  async function handleSubmit() {
    setSaving(true); setError(null);
    try {
      await postApi("/submit", {});
      router.push("/lawyer/pending-review");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submission failed.";
      setError(msg);
    } finally { setSaving(false); }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Complete your professional profile
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          This information will be reviewed by our admin team before your
          profile becomes visible to clients.
        </p>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map(({ id, label, icon: Icon }, idx) => (
          <div key={id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex size-9 items-center justify-center rounded-full border-2 transition-colors ${
                  step === id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : step > id
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {step > id ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <span className="hidden text-[10px] text-gray-500 sm:block">{label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 transition-colors ${
                  step > id ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Step 1 ── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                type="number"
                min={0}
                value={yearsOfExperience}
                onChange={(e) => setYears(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Professional Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your expertise, background, and approach..."
              />
            </div>
            <StepButton onClick={handleStep1} loading={saving} label="Save & Continue" />
          </CardContent>
        </Card>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Practice Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Select all areas that apply to your practice.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SPECIALIZATIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialization(s)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    specializations.includes(s)
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <StepButton onClick={handleStep2} loading={saving} label="Save & Continue" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3 — Consultation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Consultation Fee (LKR)
              </label>
              <input
                type="number"
                min={1}
                step={0.01}
                value={consultationFee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 5000.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Colombo, Kandy, Galle..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <StepButton onClick={handleStep3} loading={saving} label="Save & Continue" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 4 ── */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4 — Verification Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Upload each document to your storage provider, then paste the URL
              below. Required: Bar Council Certificate, National ID, and Practicing Certificate.
            </p>

            {/* Add document row */}
            <div className="flex gap-2">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DOCUMENT_TYPES.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://storage.example.com/doc.pdf"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addDocument}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Add
              </button>
            </div>

            {/* Uploaded list */}
            {documents.length > 0 && (
              <ul className="space-y-2">
                {documents.map((d) => (
                  <li
                    key={d.documentType}
                    className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-green-800">
                      {DOCUMENT_TYPES.find((x) => x.key === d.documentType)?.label ??
                        d.documentType}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDocuments((prev) =>
                          prev.filter((x) => x.documentType !== d.documentType)
                        )
                      }
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <StepButton onClick={handleStep4} loading={saving} label="Save & Continue" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 5 — Review & Submit ── */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 5 — Review & Submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Review your details below. Once submitted your profile will be
              reviewed by an admin — you won&apos;t be able to edit it until a
              decision is made.
            </p>

            <div className="divide-y rounded-lg border text-sm">
              <Row label="Experience" value={`${yearsOfExperience} year(s)`} />
              <Row label="Bio"        value={bio.slice(0, 120) + (bio.length > 120 ? "…" : "")} />
              <Row
                label="Specializations"
                value={specializations.map((s) => s.replace(/_/g, " ")).join(", ") || "—"}
              />
              <Row label="Fee"      value={`LKR ${parseFloat(consultationFee || "0").toFixed(2)}`} />
              <Row label="Location" value={location} />
              <Row
                label="Documents"
                value={`${documents.length} file(s) added`}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(4)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <StepButton
                onClick={handleSubmit}
                loading={saving}
                label="Submit for Review"
                variant="success"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Small sub-components ─────────────────────────────────────────────────────

function StepButton({
  onClick,
  loading,
  label,
  variant = "primary",
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  variant?: "primary" | "success";
}) {
  const base =
    "rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60";
  const color =
    variant === "success"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-blue-600 hover:bg-blue-700";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`${base} ${color}`}
    >
      {loading ? "Saving…" : label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <span className="w-32 shrink-0 font-medium text-gray-600">{label}</span>
      <span className="text-gray-800">{value || "—"}</span>
    </div>
  );
}
