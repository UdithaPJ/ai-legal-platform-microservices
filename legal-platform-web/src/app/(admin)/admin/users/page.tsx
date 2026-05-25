"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import Link from "next/link";

type Role = "ALL" | "CLIENT" | "LAWYER" | "ADMIN";
type Status = "ALL" | "Active" | "Pending" | "Suspended";

const allUsers = [
  { id: "u-1", name: "Jordan Lee", email: "jordan@example.com", role: "CLIENT", joinedAt: "May 24, 2026", status: "Active" },
  { id: "u-2", name: "Dr. Maya Singh", email: "m.singh@lawfirm.com", role: "LAWYER", joinedAt: "May 23, 2026", status: "Pending" },
  { id: "u-3", name: "Carlos Rivera", email: "carlos.r@example.com", role: "CLIENT", joinedAt: "May 22, 2026", status: "Active" },
  { id: "u-4", name: "Priya Nair", email: "priya@legalcorp.com", role: "LAWYER", joinedAt: "May 21, 2026", status: "Active" },
  { id: "u-5", name: "David Kim", email: "dkim@example.com", role: "CLIENT", joinedAt: "May 20, 2026", status: "Suspended" },
  { id: "u-6", name: "Sarah Mitchell", email: "smitchell@example.com", role: "LAWYER", joinedAt: "Jan 12, 2026", status: "Active" },
  { id: "u-7", name: "James Okafor", email: "jokafor@example.com", role: "LAWYER", joinedAt: "Feb 3, 2026", status: "Active" },
  { id: "u-8", name: "Alex Johnson", email: "alex.j@example.com", role: "CLIENT", joinedAt: "Apr 5, 2026", status: "Active" },
  { id: "u-9", name: "Maria Garcia", email: "m.garcia@example.com", role: "CLIENT", joinedAt: "Mar 18, 2026", status: "Active" },
  { id: "u-10", name: "Platform Admin", email: "admin@legalplatform.com", role: "ADMIN", joinedAt: "Jan 1, 2026", status: "Active" },
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

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<Status>("ALL");

  const filtered = allUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        <span className="text-sm text-gray-500">{filtered.length} of {allUsers.length} users</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            <option value="ALL">All Roles</option>
            <option value="CLIENT">Client</option>
            <option value="LAWYER">Lawyer</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr className="text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((u) => (
              <tr key={u.id} className="text-sm hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <Link href={`/admin/users/${u.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {u.name}
                      </Link>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{u.joinedAt}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[u.status]}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/users/${u.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    {u.status !== "Suspended" && u.role !== "ADMIN" && (
                      <button className="text-xs text-red-500 hover:underline">Suspend</button>
                    )}
                    {u.status === "Pending" && (
                      <button className="text-xs text-green-600 hover:underline">Approve</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No users match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
