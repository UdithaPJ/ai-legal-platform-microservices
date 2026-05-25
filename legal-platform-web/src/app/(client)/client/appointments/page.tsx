import Link from "next/link";
import { Plus, CalendarDays, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import type { AppointmentStatus } from "@/types/appointment";

const appointments: {
  id: string; lawyer: string; specialization: string; date: string;
  time: string; status: AppointmentStatus; fee: number;
}[] = [
  { id: "1", lawyer: "Sarah Mitchell", specialization: "Corporate Law", date: "Jun 5, 2026", time: "10:00 AM", status: "SCHEDULED", fee: 250 },
  { id: "2", lawyer: "James Okafor", specialization: "Criminal Law", date: "Jun 8, 2026", time: "2:00 PM", status: "ACCEPTED", fee: 300 },
  { id: "3", lawyer: "Priya Sharma", specialization: "Family Law", date: "May 20, 2026", time: "11:00 AM", status: "COMPLETED", fee: 200 },
  { id: "4", lawyer: "Michael Torres", specialization: "IP Law", date: "May 10, 2026", time: "3:00 PM", status: "CANCELLED", fee: 350 },
  { id: "5", lawyer: "Aisha Patel", specialization: "Real Estate", date: "Jun 12, 2026", time: "9:00 AM", status: "REQUESTED", fee: 220 },
];

export default function ClientAppointmentsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{appointments.length} appointments total</p>
        <Link
          href="/client/appointments/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="size-4" />
          New Appointment
        </Link>
      </div>

      <div className="space-y-3">
        {appointments.map((appt) => (
          <Link key={appt.id} href={`/client/appointments/${appt.id}`}>
            <Card className="cursor-pointer transition-all hover:ring-blue-300">
              <CardContent className="pt-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {appt.lawyer.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{appt.lawyer}</p>
                      <p className="text-xs text-gray-500">{appt.specialization}</p>
                    </div>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {appt.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {appt.time}
                  </div>
                  <span className="ml-auto font-medium text-gray-700">${appt.fee}/hr</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
