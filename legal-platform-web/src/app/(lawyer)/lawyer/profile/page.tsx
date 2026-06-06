"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DollarSign, Edit, MapPin, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatSpecialization, toAvatarUrl } from "@/lib/display";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { LawyerResponseDTO } from "@/types/lawyer";
import type { LawyerRatingSummaryDTO, ReviewResponseDTO } from "@/types/review";
import type { UserResponse } from "@/types/user";

export default function LawyerProfilePage() {
  const { data: session, status } = useSession();

  const [lawyer, setLawyer] = useState<LawyerResponseDTO | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponseDTO[]>([]);
  const [summary, setSummary] = useState<LawyerRatingSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session.user.sub) {
      if (status !== "loading") {
        setLoading(false);
      }
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const [lawyerData, userData, reviewsData, summaryData] = await Promise.all([
          apiFetch<LawyerResponseDTO>(`/lawyers/user/${session.user.sub}`),
          apiFetch<UserResponse>(`/users/${session.user.sub}`).catch(() => null),
          apiFetch<ReviewResponseDTO[]>(`/reviews/lawyer/${session.user.sub}`).catch(() => []),
          apiFetch<LawyerRatingSummaryDTO>(`/reviews/lawyer/${session.user.sub}/summary`).catch(() => null),
        ]);

        if (!cancelled) {
          setLawyer(lawyerData);
          setUser(userData);
          setReviews(reviewsData);
          setSummary(summaryData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile.");
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
  }, [session?.user.sub, status]);

  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Loading profile...</div>;
  }

  if (error || !lawyer) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error ?? "Could not load your profile."}
      </div>
    );
  }

  const fullName = user?.fullName ?? "Lawyer";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <UserAvatar
                name={fullName}
                photoUrl={toAvatarUrl(user?.profilePictureUrl)}
                size="xl"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
                <p className="text-sm text-gray-500">Bar No. {lawyer.barRegistrationNumber}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {lawyer.specializations.map((specialization) => (
                    <span key={specialization} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {formatSpecialization(specialization)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/lawyer/profile/edit"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit className="size-4" /> Edit
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 text-gray-400" />
              {lawyer.location}
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="size-4 text-gray-400" />
              {formatCurrency(lawyer.consultationFee)}/hr
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {summary?.averageRating ?? lawyer.averageRating ?? 0} · {summary?.totalReviews ?? lawyer.reviewCount} reviews
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                lawyer.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {lawyer.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-600">{lawyer.bio}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Years Experience", value: lawyer.yearsOfExperience },
          { label: "Client Reviews", value: summary?.totalReviews ?? lawyer.reviewCount },
          { label: "Rating", value: summary?.averageRating ?? lawyer.averageRating ?? 0 },
        ].map(({ label, value }) => (
          <Card key={label} size="sm">
            <CardContent className="pt-1 text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 divide-y divide-gray-100">
          {reviews.length === 0 ? (
            <div className="pt-4 text-sm text-gray-500">No reviews yet.</div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="pt-4 first:pt-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{review.clientName ?? "Client"}</p>
                  <span className="text-xs text-gray-400">
                    {new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(review.createdAt))}
                  </span>
                </div>
                <div className="my-1 flex">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`size-3.5 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">{review.comment || "No written feedback."}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
