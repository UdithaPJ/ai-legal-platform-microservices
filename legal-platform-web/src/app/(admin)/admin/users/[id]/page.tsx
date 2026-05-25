import Link from "next/link";
import { ArrowLeft, Mail, Calendar, Shield, Briefcase, Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const users: Record<string, {
  id: string; name: string; email: string; role: string; status: string;
  joinedAt: string; lastActive: string; bio?: string;
  stats: { label: string; value: string | number }[];
}> = {
  "u-2": {
    id: "u-2", name: "Dr. Maya Singh", email: "m.singh@lawfirm.com",
    role: "LAWYER", status: "Pending", joinedAt: "May 23, 2026", lastActive: "May 23, 2026",
    bio: "Dr. Maya Singh is an attorney specialising in immigration law and civil rights, with 12 years of experience across both private practice and non-profit legal aid organisations.",
    stats: [
      { label: "Appointments", value: 0 },
      { label: "Reviews", value: 0 },
      { label: "Conversations", value: 0 },
    ],
  },
  "u-6": {
    id: "u-6", name: "Sarah Mitchell", email: "smitchell@example.com",
    role: "LAWYER", status: "Active", joinedAt: "Jan 12, 2026", lastActive: "May 24, 2026",
    bio: "Corporate attorney with 15 years of experience. Specialises in M&A, employment law, and contract disputes.",
    stats: [
      { label: "Appointments", value: 87 },
      { label: "Avg Rating", value: "4.9" },
      { label: "Reviews", value: 87 },
    ],
  },
  "u-5": {
    id: "u-5", name: "David Kim", email: "dkim@example.com",
    role: "CLIENT", status: "Suspended", joinedAt: "May 20, 2026", lastActive: "May 21, 2026",
    stats: [
      { label: "Appointments", value: 1 },
      { label: "Reviews", value: 1 },
      { label: "Conversations", value: 1 },
    ],
  },
};

const roleBadge: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-700",
  LAWYER: "bg-green-100 text-green-700",
  ADMIN: "bg-purple-100 text-purple-700",
};
const statusBadge: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Suspended: "bg-red-100 text-red-600",
};

export default async function AdminUserDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const user = users[id] ?? {
    id, name: "Unknown User", email: "—", role: "CLIENT", status: "Active",
    joinedAt: "—", lastActive: "—",
    stats: [{ label: "Appointments", value: 0 }, { label: "Reviews", value: 0 }, { label: "Conversations", value: 0 }],
  };

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">User Detail</h1>
      </div>

      {/* Profile header */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[user.role]}`}>{user.role}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[user.status]}`}>{user.status}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5"><Mail className="size-3.5" />{user.email}</div>
                  <div className="flex items-center gap-1.5"><Calendar className="size-3.5" />Joined {user.joinedAt}</div>
                  <div className="flex items-center gap-1.5"><Shield className="size-3.5" />Last active {user.lastActive}</div>
                </div>
              </div>
            </div>

            {/* Admin actions */}
            <div className="flex flex-col gap-2">
              {user.status === "Pending" && (
                <button className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
                  Approve Account
                </button>
              )}
              {user.status === "Active" && user.role !== "ADMIN" && (
                <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
                  Suspend User
                </button>
              )}
              {user.status === "Suspended" && (
                <button className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Reinstate User
                </button>
              )}
              <button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                Delete Account
              </button>
            </div>
          </div>

          {user.bio && (
            <p className="mt-4 text-sm leading-relaxed text-gray-600 border-t pt-4">{user.bio}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {user.stats.map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity */}
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {user.status === "Pending" ? (
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-4">
              <div className="flex items-center gap-2">
                <Briefcase className="size-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-700">Lawyer verification pending</p>
              </div>
              <p className="mt-1 text-xs text-amber-600 pl-6">
                Bar number and credentials need to be verified before this account becomes active.
              </p>
              <button className="mt-3 ml-6 text-xs font-medium text-amber-700 underline hover:no-underline">
                View submitted credentials →
              </button>
            </div>
          ) : user.status === "Suspended" ? (
            <div className="rounded-lg bg-red-50 border border-red-100 p-4">
              <p className="text-sm text-red-700">This account has been suspended. No activity is allowed.</p>
              <p className="text-xs text-red-500 mt-1">Suspended on May 21, 2026 · Reason: Violation of terms of service</p>
            </div>
          ) : (
            [
              { icon: Briefcase, text: "Completed appointment with Alex Johnson", time: "3 days ago" },
              { icon: MessageSquare, text: "Sent 4 messages in conversation #conv-1", time: "4 days ago" },
              { icon: Star, text: "Received 5-star review from client", time: "1 week ago" },
            ].map(({ icon: Icon, text, time }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Icon className="size-3.5 text-gray-500" />
                </div>
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
  );
}
