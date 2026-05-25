import Link from "next/link";
import { CalendarDays, MessageSquare, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";

const stats = [
  { label: "Pending Requests", value: "4", icon: Clock, href: "/lawyer/appointments" },
  { label: "Today's Sessions", value: "2", icon: CalendarDays, href: "/lawyer/appointments" },
  { label: "Unread Messages", value: "7", icon: MessageSquare, href: "/lawyer/conversations" },
];

const pendingRequests = [
  { id: "1", client: "Alex Johnson", matter: "Contract review for startup acquisition", time: "3h ago", status: "REQUESTED" as const },
  { id: "2", client: "Maria Garcia", matter: "Employment dispute with former employer", time: "5h ago", status: "REQUESTED" as const },
  { id: "3", client: "Robert Kim", matter: "Intellectual property infringement claim", time: "Yesterday", status: "ACCEPTED" as const },
];

export default function LawyerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Good morning</h2>
        <p className="text-sm text-gray-500">You have 4 pending appointment requests.</p>
      </div>

      {/* Stats */}
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
        {/* Pending requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Requests</CardTitle>
            <Link href="/lawyer/appointments" className="text-xs text-blue-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((req) => (
              <Link
                key={req.id}
                href={`/lawyer/appointments/${req.id}`}
                className="flex items-start justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{req.client}</p>
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{req.matter}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{req.time}</p>
                </div>
                <AppointmentStatusBadge status={req.status} />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
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
