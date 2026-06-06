"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import type { ReviewResponseDTO } from "@/types/review";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

type RatingFilter = "ALL" | "5" | "4" | "3" | "2" | "1";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<ReviewResponseDTO[]>("/reviews");
        setReviews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (ratingFilter === "ALL") return reviews;
    return reviews.filter((r) => r.rating === Number(ratingFilter));
  }, [reviews, ratingFilter]);

  async function deleteReview(id: number) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      await apiFetch(`/reviews/${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete review.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Review Moderation</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">{reviews.length} total reviews</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {(["ALL", "5", "4", "3", "2", "1"] as const).map((f) => {
          const count = f === "ALL" ? reviews.length : reviews.filter((r) => r.rating === Number(f)).length;
          return (
            <button
              key={f}
              onClick={() => setRatingFilter(f)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                ratingFilter === f
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "ALL" ? "All" : `${f} ★`} ({count})
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">
          Loading reviews...
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{review.clientName ?? "Client"}</p>
                    <span className="text-gray-300">·</span>
                    <p className="text-xs text-gray-400">Lawyer ID: {review.lawyerId}</p>
                    <span className="text-xs text-gray-400">
                      · {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(review.createdAt))}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <StarRow rating={review.rating} />
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{review.comment || "No written feedback."}</p>
                </div>

                <button
                  onClick={() => void deleteReview(review.id)}
                  disabled={deletingId === review.id}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" />
                  {deletingId === review.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">No reviews in this category.</div>
          )}
        </div>
      )}
    </div>
  );
}
