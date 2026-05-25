"use client";

import { useState } from "react";
import { ArrowLeft, Save, Check } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SPECIALIZATIONS = [
  "Corporate Law", "Employment Law", "Contract Disputes", "Criminal Law",
  "Intellectual Property", "Real Estate Law", "Family Law", "Immigration Law",
  "Tax Law", "Personal Injury", "Civil Litigation", "Estate Planning",
];

const initialProfile = {
  name: "Sarah Mitchell",
  barNumber: "NY-2010-58821",
  location: "New York, NY",
  bio: "I am a corporate attorney with 15 years of experience advising startups, mid-size companies, and Fortune 500 clients on transactional and employment matters. Prior to private practice, I served as in-house counsel at two publicly traded companies.",
  consultationFee: "250",
  yearsOfExperience: "15",
  specializations: ["Corporate Law", "Employment Law", "Contract Disputes"],
  isAvailable: true,
};

export default function EditLawyerProfilePage() {
  const [form, setForm] = useState(initialProfile);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleSpecialization(s: string) {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(s)
        ? prev.specializations.filter((x) => x !== s)
        : [...prev.specializations, s],
    }));
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 900);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/lawyer/profile" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {saved ? (
            <><Check className="size-4" /> Saved!</>
          ) : saving ? (
            "Saving…"
          ) : (
            <><Save className="size-4" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Bar Number</label>
              <input
                value={form.barNumber}
                onChange={(e) => setForm({ ...form, barNumber: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none text-gray-400 cursor-not-allowed"
                readOnly
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Years of Experience</label>
              <input
                type="number"
                value={form.yearsOfExperience}
                onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rates & availability */}
      <Card>
        <CardHeader><CardTitle>Rates & Availability</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Available for new clients</p>
              <p className="text-xs text-gray-500">When off, your profile will show as unavailable</p>
            </div>
            <button
              onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isAvailable ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                  form.isAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="max-w-xs">
            <label className="text-xs font-medium text-gray-500">Consultation Fee ($/hr)</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                type="number"
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specializations */}
      <Card>
        <CardHeader>
          <CardTitle>Specializations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-3">Select all that apply ({form.specializations.length} selected)</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((s) => {
              const selected = form.specializations.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSpecialization(s)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {saved ? <><Check className="size-4" /> Saved!</> : saving ? "Saving…" : <><Save className="size-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
