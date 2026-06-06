"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, Check, Save, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { toAvatarUrl } from "@/lib/display";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ImageEditorModal } from "@/components/profile/ImageEditorModal";
import { useAuthStore } from "@/store/useAuthStore";
import type { UserResponse } from "@/types/user";

export default function ClientProfilePage() {
  const { data: session, status, update } = useSession();
  const setProfilePictureUrl = useAuthStore((s) => s.setProfilePictureUrl);

  const [user,          setUser]          = useState<UserResponse | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone,    setPhone]    = useState("");

  // Profile picture
  const [photoPreview,   setPhotoPreview]   = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError,     setPhotoError]     = useState<string | null>(null);
  const [editorSrc,      setEditorSrc]      = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = session?.user?.sub;

  // ── Load user data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      if (status !== "loading") setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await apiFetch<UserResponse>(`/users/${userId}`);
        setUser(data);
        setFullName(data.fullName ?? "");
        setPhone(data.phone ?? "");
        if (data.profilePictureUrl) {
          setPhotoPreview(toAvatarUrl(data.profilePictureUrl));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, status]);

  // ── Save name / phone ───────────────────────────────────────────────────────
  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch<UserResponse>(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ fullName, phone }),
      });
      setUser(updated);
      setSaved(true);
      await update({ name: updated.fullName });
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  // ── Profile picture — open editor first ────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { setPhotoError("Image must be smaller than 5 MB."); return; }
    setPhotoError(null);
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
    setPhotoError(null);
    try {
      const form = new FormData();
      form.append("file", fileOrBlob, "profile.jpg");
      const res = await fetch(`/api/users/${userId}/profile-picture`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const url: string = await res.text();
      const bffUrl = toAvatarUrl(url);
      setPhotoPreview(bffUrl ?? "");
      setUser((prev) => prev ? { ...prev, profilePictureUrl: url } : prev);
      // Update the global store so the sidebar refreshes immediately
      setProfilePictureUrl(bffUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  const displayName = user?.fullName || session?.user?.name || "";

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">
        Loading profile…
      </div>
    );
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

      <div className="mx-auto max-w-xl space-y-6">

        {/* Profile picture */}
        <Card>
          <CardHeader><CardTitle>Profile Photo</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <UserAvatar
                name={displayName || "U"}
                photoUrl={photoPreview}
                size="xl"
                colorClass="bg-blue-100 text-blue-700"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-50"
                title="Change photo"
              >
                <Camera className="size-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                {uploadingPhoto ? "Uploading…" : "Upload a new photo"}
              </p>
              <p className="text-xs text-gray-400">JPG, PNG or WEBP · max 5 MB</p>
              {photoError && <p className="text-xs text-red-600">{photoError}</p>}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Choose file
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </CardContent>
        </Card>

        {/* Account info */}
        <Card>
          <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Email address</label>
              <input
                value={user?.email ?? ""}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">Email cannot be changed here.</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Phone number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Role</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <User className="size-4 text-gray-400" />
                <span className="text-sm text-gray-500">{user?.role ?? "CLIENT"}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saved ? (
                  <><Check className="size-4" /> Saved!</>
                ) : saving ? "Saving…" : (
                  <><Save className="size-4" /> Save Changes</>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
