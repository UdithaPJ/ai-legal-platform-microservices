import type { AppointmentStatus } from "@/types/appointment";
import { cn } from "@/lib/utils";

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  REQUESTED:       { label: "Requested",       className: "bg-blue-100 text-blue-700" },
  ACCEPTED:        { label: "Accepted",         className: "bg-green-100 text-green-700" },
  REJECTED:        { label: "Rejected",         className: "bg-red-100 text-red-700" },
  CONFIRMED:       { label: "Confirmed",        className: "bg-emerald-100 text-emerald-700" },
  SCHEDULED:       { label: "Scheduled",        className: "bg-violet-100 text-violet-700" },
  VIDEO_REQUESTED: { label: "Video Requested",  className: "bg-orange-100 text-orange-700" },
  COMPLETED:       { label: "Completed",        className: "bg-gray-100 text-gray-600" },
  CANCELLED:       { label: "Cancelled",        className: "bg-red-50 text-red-400" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
