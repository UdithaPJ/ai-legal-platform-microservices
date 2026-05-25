import Link from "next/link";
import { CalendarDays, MessageSquare, FileSearch, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Active Appointments", value: "3", icon: CalendarDays, href: "/client/appointments" },
  { label: "Unread Messages", value: "5", icon: MessageSquare, href: "/client/conversations" },
  { label: "Documents Analysed", value: "2", icon: FileSearch, href: "/client/analysis" },
];

const recentActivity = [
  { text: "Appointment with Sarah Mitchell accepted", time: "2h ago", dot: "bg-green-500" },
  { text: "New message from James Okafor", time: "4h ago", dot: "bg-blue-500" },
  { text: "Document analysis completed", time: "Yesterday", dot: "bg-violet-500" },
  { text: "Appointment request submitted", time: "2 days ago", dot: "bg-gray-400" },
];

export default function ClientDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening with your legal matters.</p>
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
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map(({ text, time, dot }) => (
              <div key={text} className="flex items-start gap-3">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`} />
                <div>
                  <p className="text-sm text-gray-700">{text}</p>
                  <p className="text-xs text-gray-400">{time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
