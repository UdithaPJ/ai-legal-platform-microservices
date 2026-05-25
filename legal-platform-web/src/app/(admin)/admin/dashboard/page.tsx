import Link from "next/link";
import { Users, Briefcase, Star, AlertCircle, TrendingUp, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Total Users", value: "1,284", change: "+12 this week", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Active Lawyers", value: "94", change: "+3 pending approval", icon: Briefcase, color: "text-green-600", bg: "bg-green-50" },
  { label: "Reviews Pending", value: "7", change: "Requires moderation", icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Flagged Reports", value: "2", change: "Needs attention", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
];

const recentUsers = [
  { id: "u-1", name: "Jordan Lee", email: "jordan@example.com", role: "CLIENT", joinedAt: "May 24, 2026", status: "Active" },
  { id: "u-2", name: "Dr. Maya Singh", email: "m.singh@lawfirm.com", role: "LAWYER", joinedAt: "May 23, 2026", status: "Pending" },
  { id: "u-3", name: "Carlos Rivera", email: "carlos.r@example.com", role: "CLIENT", joinedAt: "May 22, 2026", status: "Active" },
  { id: "u-4", name: "Priya Nair", email: "priya@legalcorp.com", role: "LAWYER", joinedAt: "May 21, 2026", status: "Active" },
  { id: "u-5", name: "David Kim", email: "dkim@example.com", role: "CLIENT", joinedAt: "May 20, 2026", status: "Suspended" },
];

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

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, change, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
                  <p className="mt-1 text-xs text-gray-400">{change}</p>
                </div>
                <div className={`rounded-lg p-2 ${bg}`}>
                  <Icon className={`size-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform health */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Appointments Today", value: "38" },
          { label: "Active Conversations", value: "126" },
          { label: "Documents Analysed", value: "519" },
          { label: "Video Sessions", value: "14" },
        ].map(({ label, value }) => (
          <Card key={label} className="border-dashed">
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-semibold text-gray-800">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent users */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Users className="size-4" /> Recent Users</CardTitle>
              <Link href="/admin/users" className="text-xs text-blue-600 hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-400">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Joined</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="text-sm">
                      <td className="py-3">
                        <Link href={`/admin/users/${u.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {u.name}
                        </Link>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-gray-500">{u.joinedAt}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[u.status]}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-4" /> Admin Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Manage Users", href: "/admin/users", desc: "View, suspend, or remove accounts" },
              { label: "Moderate Reviews", href: "/admin/reviews", desc: "7 reviews awaiting moderation" },
              { label: "Lawyer Approvals", href: "/admin/users?role=LAWYER&status=PENDING", desc: "3 pending lawyer verifications" },
              { label: "Platform Reports", href: "/admin/reports", desc: "2 flagged content reports" },
            ].map(({ label, href, desc }) => (
              <Link
                key={label}
                href={href}
                className="block rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Platform trend placeholder */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="size-4" /> Platform Activity (Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-32 items-end gap-1">
            {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95, 88, 100, 92, 85, 78, 82, 95, 105, 98, 110, 120, 115, 125, 118, 130, 125, 140, 135, 145, 142].map((h, i) => (
              <div
                key={i}
                style={{ height: `${(h / 145) * 100}%` }}
                className="flex-1 rounded-t-sm bg-blue-500 opacity-70 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-center text-gray-400">Daily active sessions — past 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
