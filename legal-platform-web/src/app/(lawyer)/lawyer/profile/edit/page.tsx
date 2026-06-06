"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Camera, Check, Save } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { ImageEditorModal } from "@/components/profile/ImageEditorModal";
import { toAvatarUrl } from "@/lib/display";
import { useAuthStore } from "@/store/useAuthStore";
import type { LawyerResponseDTO, Specialization } from "@/types/lawyer";
import type { UserResponse } from "@/types/user";

const ALL_SPECIALIZATIONS: { value: Specialization; label: string }[] = [
  { value: "CRIMINAL_LAW",      label: "Criminal Law"         },
  { value: "CIVIL_LAW",         label: "Civil Law"            },
  { value: "CORPORATE_LAW",     label: "Corporate Law"        },
  { value: "FAMILY_LAW",        label: "Family Law"           },
  { value: "INTELLECTUAL_PROPERTY", label: "Intellectual Property" },
  { value: "LABOR_LAW",         label: "Labor Law"            },
  { value: "REAL_ESTATE_LAW",   label: "Real Estate Law"      },
  { value: "IMMIGRATION_LAW",   label: "Immigration Law"      },
  { value: "TAX_LAW",           label: "Tax Law"              },
  { value: "CONSTITUTIONAL_LAW",label: "Constitutional Law"   },
];

type FormState = {
  specializations: Specialization[];
  yearsOfExperience: string;
  bio: string;
  consultationFee: string;
  location: string;
  isAvailable: boolean;
};

export default function EditLawyerProfilePage() {
  const { data: session, status, update } = useSession();
  const userId               = session?.user?.sub;
  const setProfilePictureUrl = useAuthStore((s) => s.setProfilePictureUrl);

  const [lawyerId, setLawyerId] = useState<number | null>(null);
  const [barNumber, setBarNumber] = useState("");
  const [form, setForm] = useState<FormState>({
    specializations: [], yearsOfExperience: "", bio: "",
    consultationFee: "", location: "", isAvailable: true,
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // User info (for name / profile picture)
  const [fullName,  setFullName]  = useState("");
  const [phone,     setPhone]     = useState("");

  // Profile picture
  const [photoPreview,    setPhotoPreview]    = useState<string | null>(null);
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false);
  const [photoError,      setPhotoError]      = useState<string | null>(null);
  const [editorSrc,       setEditorSrc]       = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    (async () => {
      try {
        const [lawyer, user] = await Promise.all([
          apiFetch<LawyerResponseDTO>(`/lawyers/user/${userId}`),
          apiFetch<UserResponse>(`/users/${userId}`).catch(() => null),
        ]);

        setLawyerId(lawyer.id);
        setBarNumber(lawyer.barRegistrationNumber);
        setForm({
          specializations:   lawyer.specializations ?? [],
          yearsOfExperience: lawyer.yearsOfExperience?.toString() ?? "",
          bio:               lawyer.bio ?? "",
          consultationFee:   lawyer.consultationFee?.toString() ?? "",
          location:          lawyer.location ?? "",
          isAvailable:       lawyer.isAvailable ?? true,
        });

        if (user) {
          setFullName(user.fullName ?? "");
          setPhone(user.phone ?? "");
          if (user.profilePictureUrl) {
            const fn = user.profilePictureUrl.split("/").pop();
            setPhotoPreview(`/api/uploads/profile-pictures/${fn}`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, status]);

  // ── Profile picture ─────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { setPhotoError("Max 5 MB.");               return; }
    setPhotoError(null);
    // Open the editor instead of uploading directly
    setEditorSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleEditorSave(blob: Blob) {
    setEditorSrc(null);
    setPhotoPreview(URL.createObjectURL(blob));
    await uploadPhoto(blob);
  }

  function handleEditorClose() {
    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);
  }

  async function uploadPhoto(fileOrBlob: File | Blob) {
    if (!userId) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("file", fileOrBlob, "profile.jpg");
      const res = await fetch(`/api/users/${userId}/profile-picture`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const url: string = await res.text();
      const bffUrl = toAvatarUrl(url);
      setPhotoPreview(bffUrl ?? "");
      // Push the new URL into the global store so the sidebar updates at once
      setProfilePictureUrl(bffUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!lawyerId || !userId) return;
    setSaving(true);
    setError(null);
    try {
      // Save lawyer profile fields
      await apiFetch(`/lawyers/${lawyerId}`, {
        method: "PUT",
        body: JSON.stringify({
          specializations:  form.specializations,
          yearsOfExperience: Number(form.yearsOfExperience),
          bio:              form.bio,
          consultationFee:  Number(form.consultationFee),
          location:         form.location,
          isAvailable:      form.isAvailable,
        }),
      });

      // Save user fields (name, phone)
      if (fullName.trim()) {
        await apiFetch(`/users/${userId}`, {
          method: "PUT",
          body: JSON.stringify({ fullName, phone }),
        });
        await update({ name: fullName });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function toggleSpec(value: Specialization) {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter((s) => s !== value)
        : [...prev.specializations, value],
    }));
  }

  const initials = fullName
    .split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join("") || "L";

  const SaveButton = ({ className }: { className?: string }) => (
    <button
      onClick={() => void handleSave()}
      disabled={saving || !lawyerId}
      className={`flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 ${className ?? ""}`}
    >
      {saved ? <><Check className="size-4" /> Saved!</> : saving ? "Saving…" : <><Save className="size-4" /> Save Changes</>}
    </button>
  );

  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Loading…</div>;
  }

  return (
    <>
    {editorSrc && (
      <ImageEditorModal
        imageSrc={editorSrc}
        onSave={(blob) => void handleEditorSave(blob)}
        onClose={handleEditorClose}
      />
    )}
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/lawyer/profile" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        <div className="ml-auto"><SaveButton /></div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Profile Picture + Name ── */}
      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar + upload */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Profile" className="h-full w-full object-cover"
                    onError={() => setPhotoPreview(null)} />
                ) : (
                  <span className="text-2xl font-bold text-blue-700">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                <Camera className="size-3.5" />
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">
                {uploadingPhoto ? "Uploading…" : "Profile photo"}
              </p>
              <p className="text-xs text-gray-400">JPG, PNG or WEBP · max 5 MB</p>
              {photoError && <p className="text-xs text-red-600 mt-0.5">{photoError}</p>}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="mt-1.5 rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Change photo
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Display name + phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Professional Information ── */}
      <Card>
        <CardHeader><CardTitle>Professional Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Bar Number</label>
              <input value={barNumber} readOnly
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Years of Experience</label>
            <input type="number" value={form.yearsOfExperience}
              onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
              className="mt-1 w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
        </CardContent>
      </Card>

      {/* ── Rates & Availability ── */}
      <Card>
        <CardHeader><CardTitle>Rates &amp; Availability</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Available for new clients</p>
              <p className="text-xs text-gray-500">When off, your profile shows as unavailable</p>
            </div>
            <button onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isAvailable ? "bg-blue-600" : "bg-gray-200"}`}>
              <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${form.isAvailable ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="max-w-xs">
            <label className="text-xs font-medium text-gray-500">Consultation Fee ($/hr)</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input type="number" value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm outline-none focus:border-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Specializations ── */}
      <Card>
        <CardHeader><CardTitle>Specializations</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-gray-500">Select all that apply ({form.specializations.length} selected)</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SPECIALIZATIONS.map(({ value, label }) => {
              const selected = form.specializations.includes(value);
              return (
                <button key={value} onClick={() => toggleSpec(value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected ? "bg-blue-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                  }`}>
                  {label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-4">
        <SaveButton className="px-6 py-2.5" />
      </div>
    </div>
    </>
  );
}
