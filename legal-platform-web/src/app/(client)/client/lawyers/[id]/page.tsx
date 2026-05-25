import Link from "next/link";
import { MapPin, DollarSign, Star, ArrowLeft, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const lawyers: Record<string, {
  name: string; specializations: string[]; location: string; fee: number;
  rating: number; reviews: number; experience: number; bio: string; available: boolean;
}> = {
  "1": { name: "Sarah Mitchell", specializations: ["Corporate Law", "Employment Law"], location: "New York, NY", fee: 250, rating: 4.9, reviews: 87, experience: 15, available: true, bio: "I am a corporate attorney with 15 years of experience advising startups and Fortune 500 clients on transactional and employment matters. Prior to private practice, I served as in-house counsel at two publicly traded companies. I pride myself on clear communication and practical advice." },
  "2": { name: "James Okafor", specializations: ["Criminal Law"], location: "Los Angeles, CA", fee: 300, rating: 4.8, reviews: 134, experience: 18, available: true, bio: "Former prosecutor turned defence attorney. I have tried over 200 jury trials and specialize in complex criminal matters including white-collar crime and serious violent offences. I believe every client deserves a rigorous, fearless defence." },
  "4": { name: "Michael Torres", specializations: ["Intellectual Property"], location: "San Francisco, CA", fee: 350, rating: 4.9, reviews: 51, experience: 12, available: true, bio: "Patent attorney and former software engineer. I help tech founders and companies protect their innovations, negotiate licensing deals, and defend against IP infringement." },
  "5": { name: "Aisha Patel", specializations: ["Real Estate Law"], location: "Miami, FL", fee: 220, rating: 4.6, reviews: 38, experience: 9, available: true, bio: "Focused exclusively on real estate law, I handle residential and commercial transactions, lease negotiations, and landlord-tenant disputes across Florida." },
};

const reviewsList = [
  { author: "Client A", rating: 5, comment: "Exceptional service, very responsive and knowledgeable.", date: "May 2026" },
  { author: "Client B", rating: 5, comment: "Resolved my issue efficiently and kept me informed every step.", date: "Apr 2026" },
  { author: "Client C", rating: 4, comment: "Great expertise. Would use again.", date: "Mar 2026" },
];

export default async function LawyerProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const lawyer = lawyers[id] ?? {
    name: "Lawyer", specializations: [], location: "—", fee: 0,
    rating: 0, reviews: 0, experience: 0, bio: "Profile not found.", available: false,
  };

  return (
    <div className="space-y-6">
      <Link href="/client/lawyers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="size-4" /> Back to lawyers
      </Link>

      {/* Header card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                {lawyer.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{lawyer.name}</h2>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {lawyer.specializations.map((s) => (
                    <span key={s} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{s}</span>
                  ))}
                </div>
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${lawyer.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {lawyer.available ? "Available" : "Unavailable"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
            <div className="flex items-center gap-1.5"><MapPin className="size-4" />{lawyer.location}</div>
            <div className="flex items-center gap-1.5"><DollarSign className="size-4" />${lawyer.fee}/hr</div>
            <div className="flex items-center gap-1.5"><Clock className="size-4" />{lawyer.experience} yrs experience</div>
            <div className="flex items-center gap-1.5"><Star className="size-4 fill-amber-400 text-amber-400" />{lawyer.rating} ({lawyer.reviews} reviews)</div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-600">{lawyer.bio}</p>

          {lawyer.available && (
            <Link
              href={`/client/appointments/new?lawyerId=${id}`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Book a Consultation
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader><CardTitle>Client Reviews</CardTitle></CardHeader>
        <CardContent className="divide-y divide-gray-100">
          {reviewsList.map((r) => (
            <div key={r.author} className="py-4 first:pt-0">
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
