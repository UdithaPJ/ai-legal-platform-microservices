"use client";

import { useState } from "react";
import { Star, CheckCircle, XCircle, Flag } from "lucide-react";

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

type Review = {
  id: string; author: string; lawyer: string; rating: number;
  comment: string; date: string; status: ReviewStatus; flagged?: boolean;
};

const initialReviews: Review[] = [
  { id: "r-1", author: "Alex Johnson", lawyer: "Sarah Mitchell", rating: 5, comment: "Sarah was incredibly thorough and explained everything clearly. The acquisition review was done ahead of schedule. Highly recommend.", date: "May 20, 2026", status: "PENDING" },
  { id: "r-2", author: "Maria Garcia", lawyer: "Sarah Mitchell", rating: 5, comment: "Excellent service. Resolved my employment issue quickly and professionally. Very responsive.", date: "May 18, 2026", status: "PENDING" },
  { id: "r-3", author: "Robert Kim", lawyer: "Sarah Mitchell", rating: 4, comment: "Very knowledgeable. Communication could be slightly faster but overall great experience.", date: "May 15, 2026", status: "PENDING" },
  { id: "r-4", author: "Anonymous User", lawyer: "James Okafor", rating: 1, comment: "SCAM!!! This lawyer took my money and did nothing. AVOID AT ALL COSTS.", date: "May 14, 2026", status: "PENDING", flagged: true },
  { id: "r-5", author: "Lisa Chen", lawyer: "Michael Torres", rating: 5, comment: "Michael helped us file three patents in record time. His background in software engineering made the technical explanations seamless.", date: "May 10, 2026", status: "APPROVED" },
  { id: "r-6", author: "Carlos Rivera", lawyer: "Aisha Patel", rating: 4, comment: "Aisha was great for our commercial lease negotiation. Would use again.", date: "May 8, 2026", status: "APPROVED" },
  { id: "r-7", author: "Spam Account", lawyer: "James Okafor", rating: 5, comment: "BUY FOLLOWERS NOW!! VISIT MY WEBSITE!!", date: "May 5, 2026", status: "REJECTED", flagged: true },
];

const statusConfig: Record<ReviewStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-600" },
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [filter, setFilter] = useState<ReviewStatus | "ALL">("PENDING");

  function updateStatus(id: string, newStatus: ReviewStatus) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
  }

  const filtered = filter === "ALL" ? reviews : reviews.filter((r) => r.status === filter);
  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Review Moderation</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 mt-0.5">{pendingCount} reviews awaiting moderation</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => {
          const count = f === "ALL" ? reviews.length : reviews.filter((r) => r.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === f
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {filtered.map((review) => (
          <div
            key={review.id}
            className={`rounded-xl border bg-white p-4 ${review.flagged ? "border-red-200" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">{review.author}</p>
                  <span className="text-gray-300">→</span>
                  <p className="text-sm text-blue-600">{review.lawyer}</p>
                  {review.flagged && (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                      <Flag className="size-3" /> Flagged
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[review.status].color}`}>
                    {statusConfig[review.status].label}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <StarRow rating={review.rating} />
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
              </div>

              {/* Actions */}
              {review.status === "PENDING" && (
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => updateStatus(review.id, "APPROVED")}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                  >
                    <CheckCircle className="size-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(review.id, "REJECTED")}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    <XCircle className="size-3.5" /> Reject
                  </button>
                </div>
              )}
              {review.status !== "PENDING" && (
                <button
                  onClick={() => updateStatus(review.id, "PENDING")}
                  className="shrink-0 text-xs text-gray-400 hover:text-gray-600 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No reviews in this category.</div>
        )}
      </div>
    </div>
  );
}
