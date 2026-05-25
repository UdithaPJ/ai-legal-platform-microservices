import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import type { AppointmentStatus } from "@/types/appointment";

const appointments: {
  id: string; client: string; matter: string;
  date: string; time: string; status: AppointmentStatus; fee: number;
}[] = [
  { id: "1", client: "Alex Johnson", matter: "Contract review — startup acquisition", date: "Jun 5, 2026", time: "10:00 AM", status: "SCHEDULED", fee: 250 },
  { id: "2", client: "Maria Garcia", matter: "Employment dispute with former employer", date: "Jun 8, 2026", time: "2:00 PM", status: "REQUESTED", fee: 250 },
  { id: "3", client: "Robert Kim", matter: "IP infringement claim against competitor", date: "Jun 10, 2026", time: "11:00 AM", status: "ACCEPTED", fee: 250 },
  { id: "4", client: "Lisa Chen", matter: "Business partnership dissolution", date: "May 15, 2026", time: "3:00 PM", status: "COMPLETED", fee: 250 },
  { id: "5", client: "Tom Wilson", matter: "Real estate transaction dispute", date: "May 8, 2026", time: "9:00 AM", status: "CANCELLED", fee: 250 },
];

const tabs: { label: string; statuses: AppointmentStatus[] }[] = [
  { label: "All", statuses: [] },
  { label: "Pending", statuses: ["REQUESTED"] },
  { label: "Upcoming", statuses: ["ACCEPTED", "CONFIRMED", "SCHEDULED", "VIDEO_REQUESTED"] },
  { label: "Completed", statuses: ["COMPLETED", "CANCELLED", "REJECTED"] },
];

export default function LawyerAppointmentsPage() {
  // Showing "All" tab statically
  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-gray-50 p-1">
        {tabs.map(({ label }, i) => (
          <button
            key={label}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              i === 0 ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {appointments.map((appt) => (
          <Link key={appt.id} href={`/lawyer/appointments/${appt.id}`}>
            <Card className="cursor-pointer transition-all hover:ring-blue-300">
              <CardContent className="pt-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {appt.client.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{appt.client}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{appt.matter}</p>
                    </div>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><CalendarDays className="size-3.5" />{appt.date}</div>
                  <div className="flex items-center gap-1"><Clock className="size-3.5" />{appt.time}</div>
                </div>
                {appt.status === "REQUESTED" && (
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 rounded-lg bg-green-600 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                      Accept
                    </button>
                    <button className="flex-1 rounded-lg border border-red-300 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                      Decline
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
