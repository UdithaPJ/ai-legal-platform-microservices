"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatSpecialization } from "@/lib/display";
import type { AppointmentResponseDTO, CreateAppointmentRequest } from "@/types/appointment";
import type { LawyerResponseDTO } from "@/types/lawyer";
import type { UserResponse } from "@/types/user";

type LawyerCard = {
  lawyer: LawyerResponseDTO;
  user: UserResponse | null;
};

export default function NewAppointmentPage() {
  const { data: session, status } = useSession();

  const [lawyers, setLawyers] = useState<LawyerCard[]>([]);
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [submitted, setSubmitted] = useState<AppointmentResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lawyerId = new URLSearchParams(window.location.search).get("lawyerId");
    if (lawyerId) {
      setSelectedLawyer(lawyerId);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const availableLawyers = await apiFetch<LawyerResponseDTO[]>("/lawyers/available");
        const users = await Promise.all(
          availableLawyers.map(async (lawyer) => {
            try {
              return await apiFetch<UserResponse>(`/users/${lawyer.userId}`);
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) {
          setLawyers(
            availableLawyers.map((lawyer, index) => ({
              lawyer,
              user: users[index],
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load lawyers.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedLawyerCard = useMemo(
    () => lawyers.find(({ lawyer }) => lawyer.userId === selectedLawyer) ?? null,
    [lawyers, selectedLawyer]
  );

  async function submitAppointment() {
    if (!session?.user.sub || !selectedLawyer) return;

    try {
      setSaving(true);
      setError(null);

      const payload: CreateAppointmentRequest = {
        clientId: session.user.sub,
        lawyerId: selectedLawyer,
        durationMinutes: Number(durationMinutes),
        description,
      };

      const created = await apiFetch<AppointmentResponseDTO>("/appointments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSubmitted(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create appointment.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
          <ChevronRight className="size-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Request Sent!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your appointment request has been sent to {submitted.lawyerName}.
        </p>
        <Link
          href="/client/appointments"
          className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          View Appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/client/lawyers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="size-4" /> Back to lawyers
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Book an Appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Select Lawyer</Label>
            {loading ? (
              <div className="rounded-lg border border-gray-200 px-4 py-6 text-sm text-gray-500">
                Loading available lawyers...
              </div>
            ) : (
              <div className="space-y-2">
                {lawyers.map(({ lawyer, user }) => (
                  <button
                    key={lawyer.userId}
                    type="button"
                    onClick={() => setSelectedLawyer(lawyer.userId)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedLawyer === lawyer.userId
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.fullName ?? "Lawyer"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lawyer.specializations.map(formatSpecialization).join(", ")}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(lawyer.consultationFee)}/hr
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={30}
              max={180}
              step={30}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Describe your legal matter</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Briefly describe what you need help with..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {selectedLawyerCard && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              {selectedLawyerCard.user?.fullName ?? "Selected lawyer"} charges{" "}
              {formatCurrency(selectedLawyerCard.lawyer.consultationFee)}/hr and is currently available.
            </div>
          )}

          <button
            type="button"
            disabled={
              status !== "authenticated" ||
              saving ||
              !selectedLawyer ||
              !description.trim() ||
              Number(durationMinutes) < 30 ||
              Number(durationMinutes) > 180
            }
            onClick={() => void submitAppointment()}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Sending..." : "Send Request"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
