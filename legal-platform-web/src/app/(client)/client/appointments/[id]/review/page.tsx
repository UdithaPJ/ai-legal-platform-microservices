"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { getInitials } from "@/lib/display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppointmentResponseDTO } from "@/types/appointment";
import type { CreateReviewRequest, ReviewResponseDTO } from "@/types/review";

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function LeaveReviewPage() {
  const params  = useParams<{ id: string }>();
  const router  = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [appointment, setAppointment] = useState<AppointmentResponseDTO | null>(null);
  const [existing,    setExisting]    = useState<ReviewResponseDTO | null>(null);
  const [rating,      setRating]      = useState(0);
  const [hovered,     setHovered]     = useState(0);
  const [comment,     setComment]     = useState("");
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // ── Load appointment + check for existing review ────────────────────────────
  useEffect(() => {
    if (!params.id || authStatus !== "authenticated") return;

    const clientId = session.user.sub;

    (async () => {
      try {
        const [apptData, clientReviews] = await Promise.all([
          apiFetch<AppointmentResponseDTO>(`/appointments/${params.id}`),
          apiFetch<ReviewResponseDTO[]>(`/reviews/client/${clientId}`).catch(
            () => [] as ReviewResponseDTO[]
          ),
        ]);

        const found = clientReviews.find(
          (r) => r.appointmentId === Number(params.id)
        ) ?? null;

        setAppointment(apptData);

        if (found) {
          setExisting(found);
          setRating(found.rating);
          setComment(found.comment ?? "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load appointment.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, authStatus, session?.user?.sub]);

  // ── Submit new review ───────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!appointment || !session?.user?.sub || rating === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateReviewRequest = {
        lawyerId:      appointment.lawyerId,
        clientId:      session.user.sub,
        appointmentId: appointment.id,
        rating,
        comment:       comment.trim(),
      };

      const result = await apiFetch<ReviewResponseDTO>("/reviews", {
        method: "POST",
        body:   JSON.stringify(payload),
      });

      setExisting(result);
      setSuccess(true);

      // Navigate back to the appointment after a brief confirmation pause
      setTimeout(() => router.push(`/client/appointments/${params.id}`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / error ─────────────────────────────────────────────────────────
  if (loading || authStatus === "loading") {
    return <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">Loading…</div>;
  }

  if (error && !appointment) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!appointment) return null;

  // ── Success confirmation ────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <CheckCircle className="size-14 text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900">Review submitted!</h2>
        <p className="text-sm text-gray-500">Thank you for your feedback.</p>
        <p className="text-xs text-gray-400">Redirecting to your appointment…</p>
      </div>
    );
  }

  // ── Already reviewed ────────────────────────────────────────────────────────
  if (existing && !success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/client/appointments/${params.id}`} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Your Review</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">You already reviewed this consultation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lawyer info */}
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {getInitials(appointment.lawyerName)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{appointment.lawyerName}</p>
                <p className="text-xs text-gray-400">Appointment #{appointment.id}</p>
              </div>
            </div>

            {/* Star display */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`size-6 ${
                    s <= existing.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm font-medium text-gray-700">
                {STAR_LABELS[existing.rating]}
              </span>
            </div>

            {existing.comment && (
              <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700 italic">
                &ldquo;{existing.comment}&rdquo;
              </p>
            )}

            <Link
              href={`/client/appointments/${params.id}`}
              className="inline-block text-sm text-blue-600 hover:underline"
            >
              ← Back to appointment
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Review form ─────────────────────────────────────────────────────────────
  const displayRating = hovered || rating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/client/appointments/${params.id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Leave a Review</h1>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-6">
          {/* Lawyer info */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {getInitials(appointment.lawyerName)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{appointment.lawyerName}</p>
              <p className="text-xs text-gray-400">Appointment #{appointment.id}</p>
            </div>
          </div>

          {/* Star picker */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              Rating <span className="text-red-500">*</span>
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`${s} star${s !== 1 ? "s" : ""}`}
                >
                  <Star
                    className={`size-8 transition-colors ${
                      s <= displayRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200 hover:text-amber-200"
                    }`}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-3 text-sm font-medium text-gray-600">
                  {STAR_LABELS[displayRating]}
                </span>
              )}
            </div>
            {rating === 0 && error === null && (
              <p className="mt-1 text-xs text-gray-400">Click a star to rate your experience</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Share details about your experience with this lawyer…"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/1000</p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleSubmit()}
              disabled={submitting || rating === 0}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
            <Link
              href={`/client/appointments/${params.id}`}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
