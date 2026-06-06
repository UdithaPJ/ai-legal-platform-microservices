"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
  User,
  Video,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDateOnly, formatTimeOnly, getInitials } from "@/lib/display";
import type {
  AppointmentResponseDTO,
  AppointmentStatus,
  ScheduleAppointmentRequest,
  UpdateAppointmentStatusRequest,
} from "@/types/appointment";
import type { UserResponse } from "@/types/user";

export default function LawyerAppointmentDetailPage() {
  const params = useParams<{ id: string }>();

  const [appointment, setAppointment] = useState<AppointmentResponseDTO | null>(null);
  const [client, setClient] = useState<UserResponse | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const appointmentData = await apiFetch<AppointmentResponseDTO>(`/appointments/${params.id}`);
        const clientData = await apiFetch<UserResponse>(`/users/${appointmentData.clientId}`).catch(() => null);

        if (!cancelled) {
          setAppointment(appointmentData);
          setClient(clientData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load appointment.");
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
  }, [params.id]);

  async function updateStatus(nextStatus: AppointmentStatus) {
    if (!appointment) return;

    try {
      setSubmitting(true);
      const payload: UpdateAppointmentStatusRequest = { status: nextStatus };
      const updated = await apiFetch<AppointmentResponseDTO>(`/appointments/${appointment.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setAppointment(updated);
      setShowSchedule(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update appointment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function scheduleAppointment() {
    if (!appointment || !scheduleDate || !scheduleTime) return;

    try {
      setSubmitting(true);

      const appointmentDateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      const payload: ScheduleAppointmentRequest = {
        appointmentDateTime,
      };

      const updated = await apiFetch<AppointmentResponseDTO>(`/appointments/${appointment.id}/schedule`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAppointment(updated);
      setShowSchedule(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule appointment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function markComplete() {
    if (!appointment) return;

    try {
      setSubmitting(true);
      const updated = await apiFetch<AppointmentResponseDTO>(`/appointments/${appointment.id}/complete`, {
        method: "PATCH",
      });
      setAppointment(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete appointment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Loading appointment...</div>;
  }

  if (error || !appointment) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error ?? "Could not load this appointment."}
      </div>
    );
  }

  const clientName = client?.fullName ?? "Client";
  const clientEmail = client?.email ?? "No email available";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/lawyer/appointments" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Consultation Request</h1>
          <p className="text-sm text-gray-500">Appointment #{appointment.id}</p>
        </div>
        <div className="ml-auto">
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600">
              {getInitials(clientName)}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{clientName}</h2>
              <p className="text-sm text-gray-500">{clientEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Requested Date</p>
                <p className="font-medium text-gray-800">{formatDateOnly(appointment.appointmentDateTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="font-medium text-gray-800">{formatTimeOnly(appointment.appointmentDateTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="size-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Your Rate</p>
                <p className="font-medium text-gray-800">{formatCurrency(appointment.consultationFee)}/hr</p>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-400">Client&apos;s Description</p>
            <p className="text-sm text-gray-700">{appointment.description}</p>
          </div>
          {appointment.lawyerNote ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="mb-1 text-xs font-medium text-blue-700">Existing note</p>
              <p className="text-sm text-blue-800">{appointment.lawyerNote}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {showSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule the Appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void scheduleAppointment()}
                disabled={!scheduleDate || !scheduleTime || submitting}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {submitting ? "Saving..." : "Confirm Schedule"}
              </button>
              <button
                onClick={() => setShowSchedule(false)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {appointment.status === "REQUESTED" && (
          <>
            <button
              onClick={() => void updateStatus("ACCEPTED")}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
            >
              <CheckCircle className="size-4" /> {submitting ? "Processing..." : "Accept Request"}
            </button>
            <button
              onClick={() => void updateStatus("REJECTED")}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
            >
              <XCircle className="size-4" /> Decline
            </button>
          </>
        )}
        {appointment.status === "VIDEO_REQUESTED" && (
          <button
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Calendar className="size-4" /> Schedule Appointment
          </button>
        )}
        {appointment.status === "SCHEDULED" && (
          <>
            <Link
              href={`/lawyer/video/${appointment.id}`}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Video className="size-4" /> Start Video Session
            </Link>
            <button
              onClick={() => void markComplete()}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-40"
            >
              <CheckCircle className="size-4" /> Mark Complete
            </button>
          </>
        )}
        <Link
          href="/lawyer/conversations"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <MessageSquare className="size-4" /> Message Client
        </Link>
        <Link
          href={`/admin/users/${appointment.clientId}`}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <User className="size-4" /> View Client Profile
        </Link>
      </div>
    </div>
  );
}
