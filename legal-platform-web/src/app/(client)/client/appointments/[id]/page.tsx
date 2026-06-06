"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  MessageSquare,
  Star,
  Video,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDateOnly, formatSpecialization, formatTimeOnly, getInitials } from "@/lib/display";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { LawyerResponseDTO } from "@/types/lawyer";

export default function ClientAppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();

  const [appointment, setAppointment] = useState<AppointmentResponseDTO | null>(null);
  const [lawyer, setLawyer] = useState<LawyerResponseDTO | null>(null);
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
        const lawyerData = await apiFetch<LawyerResponseDTO>(`/lawyers/user/${appointmentData.lawyerId}`).catch(() => null);

        if (!cancelled) {
          setAppointment(appointmentData);
          setLawyer(lawyerData);
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

  async function requestVideoCall() {
    if (!appointment) return;

    try {
      setSubmitting(true);
      const updated = await apiFetch<AppointmentResponseDTO>(`/appointments/${appointment.id}/video-request`, {
        method: "POST",
      });
      setAppointment(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request video call.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelAppointment() {
    if (!appointment || !session?.user.sub) return;

    try {
      setSubmitting(true);
      const updated = await apiFetch<AppointmentResponseDTO>(
        `/appointments/${appointment.id}/cancel?clientId=${session.user.sub}`,
        { method: "PATCH" }
      );
      setAppointment(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel appointment.");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/appointments" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Consultation with {appointment.lawyerName}</h1>
          <p className="text-sm text-gray-500">Appointment #{appointment.id}</p>
        </div>
        <div className="ml-auto">
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
              {getInitials(appointment.lawyerName)}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{appointment.lawyerName}</h2>
              {lawyer?.specializations?.length ? (
                <span className="mt-1 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {formatSpecialization(lawyer.specializations[0])}
                </span>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                {lawyer?.location ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {lawyer.location}
                  </span>
                ) : null}
                <span className="flex items-center gap-1.5">
                  <DollarSign className="size-3.5" />
                  {formatCurrency(appointment.consultationFee)}/hr
                </span>
              </div>
            </div>
            {lawyer ? (
              <Link href={`/client/lawyers/${lawyer.id}`} className="text-sm text-blue-600 hover:underline">
                View profile
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Date</p>
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
          </div>
          <div>
            <p className="mb-1 text-xs text-gray-400">Description</p>
            <p className="text-sm text-gray-700">{appointment.description}</p>
          </div>
          {appointment.lawyerNote ? (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="mb-1 text-xs font-medium text-amber-700">Lawyer&apos;s Notes</p>
              <p className="text-sm text-amber-800">{appointment.lawyerNote}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {(appointment.status === "SCHEDULED" || appointment.status === "VIDEO_REQUESTED") && (
          <Link
            href={`/client/video/${appointment.id}`}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Video className="size-4" /> Join Video Session
          </Link>
        )}
        {appointment.status === "ACCEPTED" && (
          <button
            onClick={() => void requestVideoCall()}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Video className="size-4" /> {submitting ? "Requesting..." : "Request Video Session"}
          </button>
        )}
        <Link
          href="/client/conversations"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <MessageSquare className="size-4" /> Message Lawyer
        </Link>
        {appointment.status === "COMPLETED" && (
          <Link
            href={`/client/appointments/${appointment.id}/review`}
            className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            <Star className="size-4" /> Leave a Review
          </Link>
        )}
        {(appointment.status === "REQUESTED" || appointment.status === "ACCEPTED") && (
          <button
            onClick={() => void cancelAppointment()}
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel Appointment
          </button>
        )}
      </div>
    </div>
  );
}
