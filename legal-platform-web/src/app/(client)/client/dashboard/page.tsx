"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CalendarDays, MessageSquare, FileSearch, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatRelativeTimestamp } from "@/lib/display";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { Conversation } from "@/types/message";

export default function ClientDashboardPage() {
  const { data: session, status } = useSession();

  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated" || !session.user.sub) return;

    (async () => {
      try {
        const [appointmentsData, conversationsData] = await Promise.all([
          apiFetch<AppointmentResponseDTO[]>(`/appointments/client/${session.user.sub}`).catch(
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

  const activeAppointments = appointments.filter((a) =>
    ["REQUESTED", "ACCEPTED", "SCHEDULED", "VIDEO_REQUESTED", "CONFIRMED"].includes(a.status)
  );

  const recentActivity = appointments
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)
    .map((a) => ({
      text: `Appointment with ${a.lawyerName} — ${a.status.replaceAll("_", " ").toLowerCase()}`,
      time: formatRelativeTimestamp(a.updatedAt),
      dot:
        a.status === "ACCEPTED" || a.status === "SCHEDULED"
          ? "bg-green-500"
          : a.status === "REQUESTED"
            ? "bg-blue-500"
            : a.status === "COMPLETED"
              ? "bg-violet-500"
              : "bg-gray-400",
    }));

  const stats = [
    {
      label: "Active Appointments",
      value: loading ? "—" : activeAppointments.length.toString(),
      icon: CalendarDays,
      href: "/client/appointments",
    },
    {
      label: "Conversations",
      value: loading ? "—" : conversations.length.toString(),
      icon: MessageSquare,
      href: "/client/conversations",
    },
    {
      label: "Documents",
      value: "—",
      icon: FileSearch,
      href: "/client/analysis",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="text-sm text-gray-500">
          {loading
            ? "Loading your legal matters..."
            : activeAppointments.length > 0
              ? `You have ${activeAppointments.length} active appointment${activeAppointments.length !== 1 ? "s" : ""}.`
              : "Here's what's happening with your legal matters."}
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
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { label: "Find a Lawyer", href: "/client/lawyers", icon: Users },
              { label: "My Appointments", href: "/client/appointments", icon: CalendarDays },
              { label: "Upload Document", href: "/client/analysis", icon: FileSearch },
              { label: "Open Messages", href: "/client/conversations", icon: MessageSquare },
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-gray-400">Loading activity...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity. Book an appointment to get started.</p>
            ) : (
              recentActivity.map(({ text, time, dot }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`} />
                  <div>
                    <p className="text-sm text-gray-700">{text}</p>
                    <p className="text-xs text-gray-400">{time}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
