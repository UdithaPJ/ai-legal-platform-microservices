"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { formatSpecialization } from "@/lib/display";
import type { LawyerResponseDTO, VerificationStatus } from "@/types/lawyer";
import type { UserResponse } from "@/types/user";

const STATUS_CONFIG: Record<VerificationStatus, { label: string; className: string }> = {
  PENDING_ONBOARDING:  { label: "Onboarding",    className: "bg-gray-100 text-gray-600"     },
  PENDING_VERIFICATION:{ label: "Pending Review", className: "bg-amber-100 text-amber-700"  },
  VERIFIED:            { label: "Verified",       className: "bg-green-100 text-green-700"  },
  REJECTED:            { label: "Rejected",       className: "bg-red-100 text-red-700"      },
  SUSPENDED:           { label: "Suspended",      className: "bg-orange-100 text-orange-700"},
};

type Tab = "ALL" | VerificationStatus;

export default function AdminLawyersPage() {
  const [lawyers, setLawyers] = useState<LawyerResponseDTO[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<Tab>("PENDING_VERIFICATION");

  useEffect(() => {
    (async () => {
      try {
        const [lawyersData, usersData] = await Promise.all([
          apiFetch<LawyerResponseDTO[]>("/admin/lawyers"),
          apiFetch<UserResponse[]>("/users").catch(() => [] as UserResponse[]),
        ]);
        setLawyers(lawyersData);
        // Build userId → user lookup for names/emails
        const map: Record<string, UserResponse> = {};
        for (const u of usersData) map[u.id] = u;
        setUserMap(map);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load lawyers.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => {
    const c: Partial<Record<Tab, number>> = { ALL: lawyers.length };
    for (const l of lawyers) {
      const s = l.verificationStatus;
      if (s) c[s] = (c[s] ?? 0) + 1;
    }
    return c;
  }, [lawyers]);

  const filtered = useMemo(() =>
    tab === "ALL" ? lawyers : lawyers.filter((l) => l.verificationStatus === tab),
    [lawyers, tab]
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "ALL",                 label: "All"           },
    { key: "PENDING_VERIFICATION",label: "Pending Review"},
    { key: "VERIFIED",            label: "Verified"      },
    { key: "REJECTED",            label: "Rejected"      },
    { key: "SUSPENDED",           label: "Suspended"     },
    { key: "PENDING_ONBOARDING",  label: "Onboarding"    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Lawyer Verification</h1>
        <span className="text-sm text-gray-500">
          {loading ? "Loading…" : `${filtered.length} of ${lawyers.length} lawyers`}
        </span>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-lg border bg-gray-50 p-1">
        {tabs.map(({ key, label }) => {
          const count = counts[key] ?? 0;
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active
                    ? key === "PENDING_VERIFICATION" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-600"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr className="text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Lawyer</th>
              <th className="px-4 py-3 font-medium">Bar No.</th>
              <th className="px-4 py-3 font-medium">Specializations</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Applied</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading lawyers…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No lawyers in this category.
                </td>
              </tr>
            ) : (
              filtered.map((l) => {
                const user = userMap[l.userId];
                const status = l.verificationStatus ?? "PENDING_ONBOARDING";
                const cfg = STATUS_CONFIG[status];
                const specs = (l.specializations ?? []).slice(0, 2);
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {user?.fullName ?? "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">{user?.email ?? l.userId}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {l.barRegistrationNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {specs.map((s) => (
                          <span key={s} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                            {formatSpecialization(s)}
                          </span>
                        ))}
                        {(l.specializations ?? []).length > 2 && (
                          <span className="text-[10px] text-gray-400">
                            +{l.specializations.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{l.location ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {l.createdAt
                        ? new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/lawyers/${l.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
