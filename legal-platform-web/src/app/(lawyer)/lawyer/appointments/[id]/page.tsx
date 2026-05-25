"use client";

import { useState } from "react";
import { ArrowLeft, Calendar, Clock, DollarSign, MessageSquare, Video, User, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
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

type Appointment = {
  id: string; clientName: string; clientEmail: string;
  matter: string; description: string; status: AppointmentStatus;
  date: string; time: string; fee: number;
};

const mockAppointment: Appointment = {
  id: "appt-req-1",
  clientName: "Alex Johnson",
  clientEmail: "alex.j@example.com",
  matter: "Startup acquisition contract",
  description:
    "I have an acquisition agreement I need reviewed urgently. The closing deadline is June 10th. The document is around 45 pages and there are several clauses I'm not comfortable with, especially around the non-compete and IP assignment. I've already uploaded the contract for AI analysis.",
  status: "REQUESTED",
  date: "June 2, 2026",
  time: "10:00 AM",
  fee: 250,
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

export default function LawyerAppointmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const [status, setStatus] = useState<AppointmentStatus>(mockAppointment.status);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [loading, setLoading] = useState(false);

  const appt = { ...mockAppointment, status };
  const { label, color } = statusConfig[status];
  const initials = appt.clientName.split(" ").map((n) => n[0]).join("");

  function simulateAction(newStatus: AppointmentStatus) {
    setLoading(true);
    setTimeout(() => {
      setStatus(newStatus);
      setLoading(false);
      setShowSchedule(false);
    }, 800);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/lawyer/appointments" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{appt.matter}</h1>
          <p className="text-sm text-gray-500">Appointment #{appt.id}</p>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${color}`}>{label}</span>
      </div>

      {/* Client info */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600">
              {initials}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{appt.clientName}</h2>
              <p className="text-sm text-gray-500">{appt.clientEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment details */}
      <Card>
        <CardHeader><CardTitle>Appointment Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Requested Date</p>
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
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="size-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Your Rate</p>
                <p className="font-medium text-gray-800">${appt.fee}/hr</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Client's Description</p>
            <p className="text-sm text-gray-700">{appt.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Schedule form */}
      {showSchedule && (
        <Card>
          <CardHeader><CardTitle>Schedule the Appointment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => simulateAction("SCHEDULED")}
                disabled={!scheduleDate || !scheduleTime || loading}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {loading ? "Saving…" : "Confirm Schedule"}
              </button>
              <button onClick={() => setShowSchedule(false)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {status === "REQUESTED" && (
          <>
            <button
              onClick={() => simulateAction("ACCEPTED")}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40"
            >
              <CheckCircle className="size-4" /> {loading ? "Processing…" : "Accept Request"}
            </button>
            <button
              onClick={() => simulateAction("REJECTED")}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-40"
            >
              <XCircle className="size-4" /> Decline
            </button>
          </>
        )}
        {status === "ACCEPTED" && (
          <button
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Calendar className="size-4" /> Schedule Appointment
          </button>
        )}
        {status === "SCHEDULED" && (
          <>
            <Link
              href={`/lawyer/video/${appt.id}`}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Video className="size-4" /> Start Video Session
            </Link>
            <button
              onClick={() => simulateAction("COMPLETED")}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              <CheckCircle className="size-4" /> Mark Complete
            </button>
          </>
        )}
        <Link
          href="/lawyer/conversations/conv-1"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <MessageSquare className="size-4" /> Message Client
        </Link>
        <Link
          href={`/lawyer/appointments/${appt.id}/notes`}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <User className="size-4" /> View Client Profile
        </Link>
      </div>
    </div>
  );
}
