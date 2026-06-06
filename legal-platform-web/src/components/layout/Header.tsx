"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/client/dashboard": "Dashboard",
  "/client/lawyers": "Browse Lawyers",
  "/client/appointments": "My Appointments",
  "/client/conversations": "Messages",
  "/client/analysis": "Document Analysis",
  "/lawyer/dashboard": "Dashboard",
  "/lawyer/profile": "My Profile",
  "/lawyer/profile/edit": "Edit Profile",
  "/lawyer/appointments": "Appointments",
  "/lawyer/conversations": "Messages",
  "/admin/dashboard": "Dashboard",
  "/admin/lawyers":   "Lawyer Verification",
  "/admin/users":     "User Management",
  "/admin/reviews":   "Review Moderation",
  "/client/profile": "My Profile",
};

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/client/lawyers/")) return "Lawyer Profile";
  if (pathname.startsWith("/client/appointments/new")) return "Book Appointment";
  if (pathname.endsWith("/review")) return "Leave a Review";
  if (pathname.startsWith("/client/appointments/")) return "Appointment Detail";
  if (pathname.startsWith("/client/conversations/")) return "Chat";
  if (pathname.startsWith("/client/analysis/")) return "Analysis Results";
  if (pathname.startsWith("/client/video/")) return "Video Session";
  if (pathname.startsWith("/lawyer/appointments/")) return "Appointment Detail";
  if (pathname.startsWith("/lawyer/conversations/")) return "Chat";
  if (pathname.startsWith("/lawyer/video/")) return "Video Session";
  if (pathname.startsWith("/admin/lawyers/")) return "Lawyer Review";
  if (pathname.startsWith("/admin/users/"))  return "User Detail";
  return "Legal Platform";
}

export function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="size-5" />
        </button>
      </div>
    </header>
  );
}
