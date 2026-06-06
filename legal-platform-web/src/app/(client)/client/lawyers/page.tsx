"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DollarSign, MapPin, Search, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatSpecialization, toAvatarUrl } from "@/lib/display";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { LawyerResponseDTO } from "@/types/lawyer";
import type { UserResponse } from "@/types/user";

const allFilter = "All";

type LawyerCardData = {
  lawyer: LawyerResponseDTO;
  user: UserResponse | null;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function BrowseLawyersPage() {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(allFilter);
  const [lawyers, setLawyers] = useState<LawyerCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const lawyerProfiles = await apiFetch<LawyerResponseDTO[]>("/lawyers");
        const users = await Promise.all(
          lawyerProfiles.map(async (lawyer) => {
            try {
              return await apiFetch<UserResponse>(`/users/${lawyer.userId}`);
            } catch {
              return null;
            }
          })
        );

        if (!cancelled) {
          setLawyers(
            lawyerProfiles.map((lawyer, index) => ({
              lawyer,
              user: users[index],
            }))
          );
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load lawyers.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const specializationFilters = useMemo(() => {
    const labels = new Set<string>();
    lawyers.forEach(({ lawyer }) =>
      lawyer.specializations.forEach((specialization) => labels.add(formatSpecialization(specialization)))
    );
    return [allFilter, ...Array.from(labels)];
  }, [lawyers]);

  const filteredLawyers = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();

    return lawyers.filter(({ lawyer, user }) => {
      const matchesFilter =
        selectedFilter === allFilter ||
        lawyer.specializations.some(
          (specialization) => formatSpecialization(specialization) === selectedFilter
        );

      if (!matchesFilter) return false;
      if (!loweredQuery) return true;

      const haystack = [
        user?.fullName ?? "",
        lawyer.location,
        lawyer.bio,
        ...lawyer.specializations.map(formatSpecialization),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(loweredQuery);
    });
  }, [lawyers, query, selectedFilter]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, specialization, or location..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {specializationFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selectedFilter === filter
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500">{filteredLawyers.length} lawyers found</p>

      {loading ? (
        <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">
          Loading lawyers...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredLawyers.map(({ lawyer, user }) => (
            <Card key={lawyer.id}>
              <CardContent className="pt-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={user?.fullName ?? "Lawyer"}
                      photoUrl={toAvatarUrl(user?.profilePictureUrl)}
                      size="md"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{user?.fullName ?? "Lawyer"}</h3>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {lawyer.specializations.map((specialization) => (
                          <span key={specialization} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {formatSpecialization(specialization)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      lawyer.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {lawyer.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-gray-500">{lawyer.bio}</p>

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {lawyer.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="size-3.5" />
                    {formatCurrency(lawyer.consultationFee)}/hr
                  </div>
                  <StarRating rating={lawyer.averageRating ?? 0} />
                  <span className="text-xs text-gray-400">({lawyer.reviewCount})</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/client/lawyers/${lawyer.id}`}
                    className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View Profile
                  </Link>
                  {lawyer.isAvailable && (
                    <Link
                      href={`/client/appointments/new?lawyerId=${lawyer.userId}`}
                      className="flex-1 rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Book Now
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
