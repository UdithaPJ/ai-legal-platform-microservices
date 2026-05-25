import Link from "next/link";
import { ArrowLeft, MapPin, DollarSign, Calendar, Clock, Video, MessageSquare, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AppointmentStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "REJECTED"
  | "CONFIRMED"
  | "SCHEDULED"
  | "VIDEO_REQUESTED"
  | "COMPLETED"
  | "CANCELLED";

const appointments: Record<string, {
  id: string; lawyer: string; specialization: string; matter: string;
  description: string; status: AppointmentStatus; date: string; time: string;
  fee: number; location: string; notes?: string;
}> = {
  "appt-1": {
    id: "appt-1", lawyer: "Sarah Mitchell", specialization: "Corporate Law",
    matter: "Startup acquisition contract", description: "Need help reviewing an acquisition agreement with a non-compete clause.",
    status: "SCHEDULED", date: "June 2, 2026", time: "10:00 AM", fee: 250,
    location: "New York, NY", notes: "Please bring a copy of the contract and any prior correspondence.",
  },
  "appt-2": {
    id: "appt-2", lawyer: "James Okafor", specialization: "Criminal Law",
    matter: "Criminal defence consultation", description: "Initial consultation for a white-collar fraud charge.",
    status: "REQUESTED", date: "Pending confirmation", time: "—", fee: 300,
    location: "Los Angeles, CA",
  },
  "appt-3": {
    id: "appt-3", lawyer: "Michael Torres", specialization: "Intellectual Property",
    matter: "Patent filing review", description: "Review of provisional patent application for a SaaS product.",
    status: "COMPLETED", date: "May 10, 2026", time: "2:00 PM", fee: 350,
    location: "San Francisco, CA",
  },
};

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  REQUESTED: { label: "Pending Review", color: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "Accepted", color: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700" },
  CONFIRMED: { label: "Confirmed", color: "bg-green-100 text-green-700" },
  SCHEDULED: { label: "Scheduled", color: "bg-green-100 text-green-700" },
  VIDEO_REQUESTED: { label: "Video Requested", color: "bg-purple-100 text-purple-700" },
  COMPLETED: { label: "Completed", color: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-400" },
};

export default async function ClientAppointmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const appt = appointments[id] ?? appointments["appt-1"];
  const { label, color } = statusConfig[appt.status];
  const initials = appt.lawyer.split(" ").map((n) => n[0]).join("");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/client/appointments" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{appt.matter}</h1>
          <p className="text-sm text-gray-500">Appointment #{appt.id}</p>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${color}`}>{label}</span>
      </div>

      {/* Lawyer info */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{appt.lawyer}</h2>
              <span className="inline-block mt-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {appt.specialization}
              </span>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{appt.location}</span>
                <span className="flex items-center gap-1.5"><DollarSign className="size-3.5" />${appt.fee}/hr</span>
              </div>
            </div>
            <Link
              href={`/client/lawyers/1`}
              className="text-sm text-blue-600 hover:underline"
            >
              View profile
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Appointment details */}
      <Card>
        <CardHeader><CardTitle>Appointment Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="font-medium text-gray-800">{appt.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="font-medium text-gray-800">{appt.time}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Matter</p>
            <p className="text-sm font-medium text-gray-800">{appt.matter}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700">{appt.description}</p>
          </div>
          {appt.notes && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
              <p className="text-xs font-medium text-amber-700 mb-1">Lawyer's Notes</p>
              <p className="text-sm text-amber-800">{appt.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {(appt.status === "SCHEDULED" || appt.status === "VIDEO_REQUESTED") && (
          <Link
            href={`/client/video/${appt.id}`}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Video className="size-4" /> Join Video Session
          </Link>
        )}
        <Link
          href="/client/conversations/conv-1"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <MessageSquare className="size-4" /> Message Lawyer
        </Link>
        {appt.status === "COMPLETED" && (
          <Link
            href={`/client/appointments/${id}/review`}
            className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            <Star className="size-4" /> Leave a Review
          </Link>
        )}
        {(appt.status === "REQUESTED" || appt.status === "ACCEPTED") && (
          <button className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            Cancel Appointment
          </button>
        )}
      </div>
    </div>
  );
}
