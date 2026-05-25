import Link from "next/link";
import { Search, MapPin, Star, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const specializations = [
  "All", "Corporate Law", "Criminal Law", "Family Law",
  "Intellectual Property", "Immigration Law", "Employment Law", "Real Estate Law",
];

const lawyers = [
  {
    id: "1", name: "Sarah Mitchell", specializations: ["Corporate Law", "Employment Law"],
    location: "New York, NY", fee: 250, rating: 4.9, reviews: 87, available: true,
    bio: "15 years of experience in corporate transactions and employment disputes.",
  },
  {
    id: "2", name: "James Okafor", specializations: ["Criminal Law"],
    location: "Los Angeles, CA", fee: 300, rating: 4.8, reviews: 134, available: true,
    bio: "Former prosecutor with deep expertise in white-collar and violent crime defence.",
  },
  {
    id: "3", name: "Priya Sharma", specializations: ["Family Law", "Immigration Law"],
    location: "Chicago, IL", fee: 200, rating: 4.7, reviews: 62, available: false,
    bio: "Compassionate advocate for families navigating divorce, custody, and immigration.",
  },
  {
    id: "4", name: "Michael Torres", specializations: ["Intellectual Property"],
    location: "San Francisco, CA", fee: 350, rating: 4.9, reviews: 51, available: true,
    bio: "Patent attorney specialising in tech startups and software IP protection.",
  },
  {
    id: "5", name: "Aisha Patel", specializations: ["Real Estate Law"],
    location: "Miami, FL", fee: 220, rating: 4.6, reviews: 38, available: true,
    bio: "Residential and commercial real estate transactions across the Southeast.",
  },
  {
    id: "6", name: "David Chen", specializations: ["Corporate Law"],
    location: "Seattle, WA", fee: 280, rating: 4.8, reviews: 93, available: false,
    bio: "M&A specialist with experience in cross-border technology acquisitions.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium text-gray-700">{rating}</span>
    </div>
  );
}

export default function BrowseLawyersPage() {
  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, specialisation, or location…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {specializations.map((s) => (
          <button
            key={s}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              s === "All"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-sm text-gray-500">{lawyers.length} lawyers found</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {lawyers.map((lawyer) => (
          <Card key={lawyer.id}>
            <CardContent className="pt-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {lawyer.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{lawyer.name}</h3>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {lawyer.specializations.map((s) => (
                        <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  lawyer.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {lawyer.available ? "Available" : "Unavailable"}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-500 line-clamp-2">{lawyer.bio}</p>

              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {lawyer.location}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="size-3.5" />
                  ${lawyer.fee}/hr
                </div>
                <StarRating rating={lawyer.rating} />
                <span className="text-xs text-gray-400">({lawyer.reviews})</span>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/client/lawyers/${lawyer.id}`}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View Profile
                </Link>
                {lawyer.available && (
                  <Link
                    href={`/client/appointments/new?lawyerId=${lawyer.id}`}
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
    </div>
  );
}
