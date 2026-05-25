"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  FileSearch,
  Video,
  Star,
  UserCircle,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type Role = "CLIENT" | "LAWYER" | "ADMIN";

const clientNav = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/lawyers", label: "Browse Lawyers", icon: Users },
  { href: "/client/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/client/conversations", label: "Messages", icon: MessageSquare },
  { href: "/client/analysis", label: "Doc Analysis", icon: FileSearch },
];

const lawyerNav = [
  { href: "/lawyer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lawyer/profile", label: "My Profile", icon: UserCircle },
  { href: "/lawyer/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/lawyer/conversations", label: "Messages", icon: MessageSquare },
];

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

const navByRole: Record<Role, typeof clientNav> = {
  CLIENT: clientNav,
  LAWYER: lawyerNav,
  ADMIN: adminNav,
};

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navByRole[role];

  return (
    <aside className="flex h-screen w-60 flex-col bg-gray-900 text-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <Scale className="size-6 text-blue-400" />
        <span className="text-lg font-semibold tracking-tight">LegalAI</span>
      </div>

      <Separator className="bg-gray-700" />

      {/* Role badge */}
      <div className="px-5 py-3">
        <span className="rounded-full bg-blue-900/60 px-2.5 py-0.5 text-xs font-medium text-blue-300">
          {role}
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-gray-700" />

      {/* Bottom: user placeholder */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold uppercase text-white">
          U
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">User</p>
          <p className="truncate text-xs text-gray-400">{role.toLowerCase()}@platform.com</p>
        </div>
      </div>
    </aside>
  );
}
