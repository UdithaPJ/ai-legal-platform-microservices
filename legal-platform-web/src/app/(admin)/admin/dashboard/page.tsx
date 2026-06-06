"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Briefcase, Star, TrendingUp, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { LawyerResponseDTO } from "@/types/lawyer";
import type { UserResponse } from "@/types/user";

const roleBadge: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-700",
  LAWYER: "bg-green-100 text-green-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [lawyers, setLawyers] = useState<LawyerResponseDTO[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersData, lawyersData, appointmentsData] = await Promise.all([
          apiFetch<UserResponse[]>("/users").catch(() => [] as UserResponse[]),
          apiFetch<LawyerResponseDTO[]>("/lawyers").catch(() => [] as LawyerResponseDTO[]),
          apiFetch<AppointmentResponseDTO[]>("/appointments").catch(() => [] as AppointmentResponseDTO[]),
        ]);
        setUsers(usersData);
        setLawyers(lawyersData);
        setAppointments(appointmentsData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const clientCount = users.filter((u) => u.role === "CLIENT").length;
  const lawyerCount = users.filter((u) => u.role === "LAWYER").length;
  const availableLawyerCount = lawyers.filter((l) => l.isAvailable).length;
  const pendingVerificationCount = lawyers.filter((l) => l.verificationStatus === "PENDING_VERIFICATION").length;

  const today = new Date().toDateString();
  const appointmentsToday = appointments.filter(
    (a) => a.appointmentDateTime && new Date(a.appointmentDateTime).toDateString() === today
  ).length;
  const pendingAppointments = appointments.filter((a) => a.status === "REQUESTED").length;

  const recentUsers = [...users].slice(-5).reverse();

  const stats = [
    {
      label: "Total Users",
      value: loading ? "—" : users.length.toString(),
      change: `${clientCount} clients · ${lawyerCount} lawyers`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Lawyers",
      value: loading ? "—" : lawyerCount.toString(),
      change: `${availableLawyerCount} currently available`,
      icon: Briefcase,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending Appointments",
      value: loading ? "—" : pendingAppointments.toString(),
      change: "Awaiting lawyer response",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Appointments Today",
      value: loading ? "—" : appointmentsToday.toString(),
      change: `${appointments.length} total appointments`,
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" /> Recent Users
              </CardTitle>
              <Link href="/admin/users" className="text-xs text-blue-600 hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-4 text-sm text-gray-400">Loading users...</p>
              ) : recentUsers.length === 0 ? (
                <p className="py-4 text-sm text-gray-400">No users found.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-400">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Role</th>
                      <th className="pb-2 font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentUsers.map((u) => (
                      <tr key={u.id} className="text-sm">
                        <td className="py-3">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {u.fullName}
                          </Link>
                        </td>
                        <td className="py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-gray-400">{u.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" /> Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                label: "Lawyer Verification",
                href: "/admin/lawyers",
                desc: pendingVerificationCount > 0
                  ? `${pendingVerificationCount} pending review`
                  : "Review lawyer applications",
                urgent: pendingVerificationCount > 0,
              },
              { label: "Manage Users",     href: "/admin/users",    desc: "View and manage all accounts", urgent: false },
              { label: "Moderate Reviews", href: "/admin/reviews",  desc: "View all platform reviews",    urgent: false },
            ].map(({ label, href, desc, urgent }) => (
              <Link
                key={label}
                href={href}
                className={`block rounded-lg border p-3 transition-colors hover:bg-gray-50 ${
                  urgent ? "border-amber-200 bg-amber-50" : "border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  {urgent && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {pendingVerificationCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {!loading && appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" /> Appointment Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
              {(["REQUESTED","ACCEPTED","SCHEDULED","VIDEO_REQUESTED","CONFIRMED","COMPLETED","CANCELLED","REJECTED"] as const).map((status) => {
                const count = appointments.filter((a) => a.status === status).length;
                return (
                  <div key={status} className="text-center">
                    <p className="text-xl font-bold text-gray-800">{count}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{status.replaceAll("_", " ")}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
