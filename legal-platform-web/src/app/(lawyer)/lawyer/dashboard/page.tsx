"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CalendarDays, MessageSquare, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { apiFetch } from "@/lib/api-client";
import { formatRelativeTimestamp } from "@/lib/display";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { Conversation } from "@/types/message";

export default function LawyerDashboardPage() {
  const { data: session, status } = useSession();

  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !session.user.sub) return;

    (async () => {
      try {
        const [appointmentsData, conversationsData] = await Promise.all([
          apiFetch<AppointmentResponseDTO[]>(`/appointments/lawyer/${session.user.sub}`).catch(
            () => [] as AppointmentResponseDTO[]
          ),
          apiFetch<Conversation[]>("/messages/conversations/me").catch(() => [] as Conversation[]),
        ]);
        setAppointments(appointmentsData);
        setConversations(conversationsData);
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user.sub, status]);

  const pendingRequests = appointments.filter((a) => a.status === "REQUESTED");

  const today = new Date().toDateString();
  const todaysSessions = appointments.filter(
    (a) =>
      a.appointmentDateTime &&
      new Date(a.appointmentDateTime).toDateString() === today &&
      ["SCHEDULED", "VIDEO_REQUESTED", "ACCEPTED"].includes(a.status)
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const stats = [
    {
      label: "Pending Requests",
      value: loading ? "—" : pendingRequests.length.toString(),
      icon: Clock,
      href: "/lawyer/appointments",
    },
    {
      label: "Today's Sessions",
      value: loading ? "—" : todaysSessions.length.toString(),
      icon: CalendarDays,
      href: "/lawyer/appointments",
    },
    {
      label: "Conversations",
      value: loading ? "—" : conversations.length.toString(),
      icon: MessageSquare,
      href: "/lawyer/conversations",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Good {greeting}{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="text-sm text-gray-500">
          {loading
            ? "Loading your appointments..."
            : pendingRequests.length > 0
              ? `You have ${pendingRequests.length} pending appointment request${pendingRequests.length !== 1 ? "s" : ""}.`
              : "No pending requests right now."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="cursor-pointer transition-all hover:ring-blue-400">
              <CardContent className="flex items-center gap-4 pt-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
                  <Icon className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Requests</CardTitle>
            <Link href="/lawyer/appointments" className="text-xs text-blue-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-gray-400">No pending requests.</p>
            ) : (
              pendingRequests.slice(0, 5).map((req) => (
                <Link
                  key={req.id}
                  href={`/lawyer/appointments/${req.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{req.description}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{formatRelativeTimestamp(req.createdAt)}</p>
                  </div>
                  <AppointmentStatusBadge status={req.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "Manage Appointments", href: "/lawyer/appointments", icon: CalendarDays },
              { label: "Open Messages", href: "/lawyer/conversations", icon: MessageSquare },
              { label: "Edit My Profile", href: "/lawyer/profile/edit", icon: CheckCircle },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <ArrowRight className="size-4 text-gray-400" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
