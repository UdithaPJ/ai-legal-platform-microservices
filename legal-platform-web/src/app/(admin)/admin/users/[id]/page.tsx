"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Briefcase, Star, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatSpecialization, getInitials } from "@/lib/display";
import type { LawyerResponseDTO } from "@/types/lawyer";
import type { LawyerRatingSummaryDTO, ReviewResponseDTO } from "@/types/review";
import type { UserResponse } from "@/types/user";

const roleBadge: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-700",
  LAWYER: "bg-green-100 text-green-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<UserResponse | null>(null);
  const [lawyer, setLawyer] = useState<LawyerResponseDTO | null>(null);
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
        const userData = await apiFetch<UserResponse>(`/users/${params.id}`);

        let lawyerData: LawyerResponseDTO | null = null;
        let reviewsData: ReviewResponseDTO[] = [];
        let summaryData: LawyerRatingSummaryDTO | null = null;

        if (userData.role === "LAWYER") {
          [lawyerData, reviewsData, summaryData] = await Promise.all([
            apiFetch<LawyerResponseDTO>(`/lawyers/user/${userData.id}`).catch(() => null),
            apiFetch<ReviewResponseDTO[]>(`/reviews/lawyer/${userData.id}`).catch(() => []),
            apiFetch<LawyerRatingSummaryDTO>(`/reviews/lawyer/${userData.id}/summary`).catch(() => null),
          ]);
        }

        if (!cancelled) {
          setUser(userData);
          setLawyer(lawyerData);
          setReviews(reviewsData);
          setSummary(summaryData);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load user.");
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
    return (
      <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">
        Loading user...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error ?? "User not found."}
      </div>
    );
  }

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
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-600">
              {getInitials(user.fullName)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
              <div className="mt-1">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[user.role] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {user.role}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="text-xs text-gray-400">{user.phone}</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lawyer profile */}
      {lawyer && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-4" /> Lawyer Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {lawyer.specializations.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {formatSpecialization(s)}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-5 text-sm text-gray-600">
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
                  {summary?.averageRating ?? lawyer.averageRating ?? 0} ·{" "}
                  {summary?.totalReviews ?? lawyer.reviewCount} reviews
                </div>
              </div>
              {lawyer.bio && (
                <p className="text-sm text-gray-600 border-t pt-3">{lawyer.bio}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    lawyer.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {lawyer.isAvailable ? "Available" : "Unavailable"}
                </span>
                <span className="text-xs text-gray-400">
                  Bar No. {lawyer.barRegistrationNumber}
                </span>
              </div>
            </CardContent>
          </Card>

          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="py-3 first:pt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {review.clientName ?? "Client"}
                      </p>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{review.comment || "No comment."}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
