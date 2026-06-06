"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CalendarDays, Clock, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatDateOnly, formatTimeOnly } from "@/lib/display";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { LawyerResponseDTO } from "@/types/lawyer";

type LawyerMap = Record<string, LawyerResponseDTO>;

export default function ClientAppointmentsPage() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [lawyersByUserId, setLawyersByUserId] = useState<LawyerMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session.user.sub) {
      if (status !== "loading") {
        setLoading(false);
      }
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch<AppointmentResponseDTO[]>(`/appointments/client/${session.user.sub}`);
        if (cancelled) return;

        setAppointments(data);

        const uniqueLawyerIds = [...new Set(data.map((appointment) => appointment.lawyerId))];
        const lawyers = await Promise.all(
          uniqueLawyerIds.map(async (lawyerId) => {
            try {
              return await apiFetch<LawyerResponseDTO>(`/lawyers/user/${lawyerId}`);
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) {
          setLawyersByUserId(
            lawyers.filter((lawyer): lawyer is LawyerResponseDTO => lawyer !== null).reduce<LawyerMap>(
              (acc, lawyer) => {
                acc[lawyer.userId] = lawyer;
                return acc;
              },
              {}
            )
          );
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load appointments.");
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
  }, [session?.user.sub, status]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{appointments.length} appointments total</p>
        <Link
          href="/client/appointments/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="size-4" />
          New Appointment
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">
          Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">
          No appointments yet.
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const lawyer = lawyersByUserId[appointment.lawyerId];
            const primarySpecialization = lawyer?.specializations?.[0];

            return (
              <Link key={appointment.id} href={`/client/appointments/${appointment.id}`}>
                <Card className="cursor-pointer transition-all hover:ring-blue-300">
                  <CardContent className="pt-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {appointment.lawyerName
                            .split(" ")
                            .filter(Boolean)
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.lawyerName}</p>
                          <p className="text-xs text-gray-500">
                            {primarySpecialization?.replaceAll("_", " ") ?? "Consultation"}
                          </p>
                        </div>
                      </div>
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {formatDateOnly(appointment.appointmentDateTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {formatTimeOnly(appointment.appointmentDateTime)}
                      </div>
                      <span className="ml-auto font-medium text-gray-700">
                        {formatCurrency(appointment.consultationFee)}/hr
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
