import Link from "next/link";
import { MapPin, DollarSign, Star, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const profile = {
  name: "Sarah Mitchell",
  barNumber: "NY-2010-58821",
  specializations: ["Corporate Law", "Employment Law", "Contract Disputes"],
  yearsOfExperience: 15,
  bio: "I am a corporate attorney with 15 years of experience advising startups, mid-size companies, and Fortune 500 clients on transactional and employment matters. Prior to private practice, I served as in-house counsel at two publicly traded companies.",
  consultationFee: 250,
  location: "New York, NY",
  isAvailable: true,
  rating: 4.9,
  reviewCount: 87,
};

const reviews = [
  { author: "Alex J.", rating: 5, comment: "Sarah was incredibly thorough and explained everything clearly. Highly recommend.", date: "May 2026" },
  { author: "Maria G.", rating: 5, comment: "Excellent service. Resolved my employment issue quickly and professionally.", date: "Apr 2026" },
  { author: "Robert K.", rating: 4, comment: "Very knowledgeable. Communication could be slightly faster but overall great experience.", date: "Mar 2026" },
];

export default function LawyerProfilePage() {
  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                SM
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-sm text-gray-500">Bar No. {profile.barNumber}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.specializations.map((s) => (
                    <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{s}</span>
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
            <div className="flex items-center gap-1.5"><MapPin className="size-4 text-gray-400" />{profile.location}</div>
            <div className="flex items-center gap-1.5"><DollarSign className="size-4 text-gray-400" />${profile.consultationFee}/hr</div>
            <div className="flex items-center gap-1.5">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {profile.rating} · {profile.reviewCount} reviews
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${profile.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {profile.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-600">{profile.bio}</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Years Experience", value: profile.yearsOfExperience },
          { label: "Client Reviews", value: profile.reviewCount },
          { label: "Rating", value: profile.rating },
        ].map(({ label, value }) => (
          <Card key={label} size="sm">
            <CardContent className="pt-1 text-center">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reviews */}
      <Card>
        <CardHeader><CardTitle>Client Reviews</CardTitle></CardHeader>
        <CardContent className="space-y-4 divide-y divide-gray-100">
          {reviews.map((r) => (
            <div key={r.author} className="pt-4 first:pt-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{r.author}</p>
                <span className="text-xs text-gray-400">{r.date}</span>
              </div>
              <div className="my-1 flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                ))}
              </div>
              <p className="text-sm text-gray-600">{r.comment}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
