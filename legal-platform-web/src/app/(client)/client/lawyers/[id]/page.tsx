"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, DollarSign, MapPin, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatSpecialization, toAvatarUrl } from "@/lib/display";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { LawyerResponseDTO } from "@/types/lawyer";
import type { LawyerRatingSummaryDTO, ReviewResponseDTO } from "@/types/review";
import type { UserResponse } from "@/types/user";

export default function LawyerProfilePage() {
  const params = useParams<{ id: string }>();

  const [lawyer, setLawyer] = useState<LawyerResponseDTO | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponseDTO[]>([]);
  const [summary, setSummary] = useState<LawyerRatingSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const lawyerData = await apiFetch<LawyerResponseDTO>(`/lawyers/${params.id}`);
        const [userData, reviewsData, summaryData] = await Promise.all([
          apiFetch<UserResponse>(`/users/${lawyerData.userId}`).catch(() => null),
          apiFetch<ReviewResponseDTO[]>(`/reviews/lawyer/${lawyerData.userId}`).catch(() => []),
          apiFetch<LawyerRatingSummaryDTO>(`/reviews/lawyer/${lawyerData.userId}/summary`).catch(() => null),
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
          setError(err instanceof Error ? err.message : "Failed to load lawyer profile.");
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
  }, [params.id]);

  if (loading) {
    return <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Loading lawyer profile...</div>;
  }

  if (error || !lawyer) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error ?? "Could not load this lawyer profile."}
      </div>
    );
  }

  const fullName = user?.fullName ?? "Lawyer";

  return (
    <div className="space-y-6">
      <Link href="/client/lawyers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="size-4" /> Back to lawyers
      </Link>

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
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {lawyer.specializations.map((specialization) => (
                    <span key={specialization} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {formatSpecialization(specialization)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                lawyer.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {lawyer.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {lawyer.location}
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="size-4" />
              {formatCurrency(lawyer.consultationFee)}/hr
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {lawyer.yearsOfExperience} yrs experience
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {summary?.averageRating ?? lawyer.averageRating ?? 0} ({summary?.totalReviews ?? lawyer.reviewCount} reviews)
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-600">{lawyer.bio}</p>

          {lawyer.isAvailable && (
            <Link
              href={`/client/appointments/new?lawyerId=${lawyer.userId}`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Book a Consultation
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client Reviews</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          {reviews.length === 0 ? (
            <div className="py-4 text-sm text-gray-500">No reviews yet.</div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="py-4 first:pt-0">
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
