"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { getInitials } from "@/lib/display";
import type { UserResponse, UserRole } from "@/types/user";

type RoleFilter = "ALL" | UserRole;

const roleBadge: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-700",
  LAWYER: "bg-green-100 text-green-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<UserResponse[]>("/users");
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">User Management</h1>
        <span className="text-sm text-gray-500">
          {loading ? "Loading..." : `${filtered.length} of ${users.length} users`}
        </span>
      </div>

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
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            <option value="ALL">All Roles</option>
            <option value="CLIENT">Client</option>
            <option value="LAWYER">Lawyer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr className="text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">Loading users...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">No users match your filters.</td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="text-sm hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                        {getInitials(u.fullName)}
                      </div>
                      <div>
                        <Link href={`/admin/users/${u.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {u.fullName}
                        </Link>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="text-xs text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
