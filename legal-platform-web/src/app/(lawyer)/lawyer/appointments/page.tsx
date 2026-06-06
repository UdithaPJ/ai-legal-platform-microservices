"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { apiFetch } from "@/lib/api-client";
import { formatDateOnly, formatTimeOnly, getInitials } from "@/lib/display";
import type { AppointmentResponseDTO, AppointmentStatus, UpdateAppointmentStatusRequest } from "@/types/appointment";
import type { UserResponse } from "@/types/user";

const tabs: { label: string; statuses: AppointmentStatus[] }[] = [
  { label: "All", statuses: [] },
  { label: "Pending", statuses: ["REQUESTED"] },
  { label: "Upcoming", statuses: ["ACCEPTED", "CONFIRMED", "SCHEDULED", "VIDEO_REQUESTED"] },
  { label: "Completed", statuses: ["COMPLETED", "CANCELLED", "REJECTED"] },
];

export default function LawyerAppointmentsPage() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [clientsById, setClientsById] = useState<Record<string, UserResponse>>({});
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
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
        const data = await apiFetch<AppointmentResponseDTO[]>(`/appointments/lawyer/${session.user.sub}`);
        if (cancelled) return;

        setAppointments(data);

        const uniqueClientIds = [...new Set(data.map((appointment) => appointment.clientId))];
        const clients = await Promise.all(
          uniqueClientIds.map(async (clientId) => {
            try {
              return await apiFetch<UserResponse>(`/users/${clientId}`);
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) {
          setClientsById(
            clients.filter((client): client is UserResponse => client !== null).reduce<Record<string, UserResponse>>(
              (acc, client) => {
                acc[client.id] = client;
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

  async function updateStatus(appointmentId: number, nextStatus: AppointmentStatus) {
    try {
      setUpdatingId(appointmentId);
      const payload: UpdateAppointmentStatusRequest = { status: nextStatus };
      const updated = await apiFetch<AppointmentResponseDTO>(`/appointments/${appointmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setAppointments((prev) => prev.map((appointment) => (appointment.id === appointmentId ? updated : appointment)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update appointment.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredAppointments = useMemo(() => {
    const selectedTab = tabs.find((tab) => tab.label === activeTab);
    if (!selectedTab || selectedTab.statuses.length === 0) return appointments;
    return appointments.filter((appointment) => selectedTab.statuses.includes(appointment.status));
  }, [activeTab, appointments]);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-lg border bg-gray-50 p-1">
        {tabs.map(({ label }) => (
          <button
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === label ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
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
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">
          No appointments in this view yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => {
            const client = clientsById[appointment.clientId];
            const clientName = client?.fullName ?? "Client";

            return (
              <Card key={appointment.id} className="transition-all hover:ring-blue-300">
                <CardContent className="pt-2">
                  <Link href={`/lawyer/appointments/${appointment.id}`} className="block">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                          {getInitials(clientName)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{clientName}</p>
                          <p className="line-clamp-1 text-xs text-gray-500">{appointment.description}</p>
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
                    </div>
                  </Link>
                  {appointment.status === "REQUESTED" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => void updateStatus(appointment.id, "ACCEPTED")}
                        disabled={updatingId === appointment.id}
                        className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {updatingId === appointment.id ? "Saving..." : "Accept"}
                      </button>
                      <button
                        onClick={() => void updateStatus(appointment.id, "REJECTED")}
                        disabled={updatingId === appointment.id}
                        className="flex-1 rounded-lg border border-red-300 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
