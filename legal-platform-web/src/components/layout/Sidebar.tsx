"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquare,
  FileSearch,
  Star,
  UserCircle,
  Scale,
  LogOut,
  ChevronUp,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toAvatarUrl } from "@/lib/display";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuthStore } from "@/store/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Role = "CLIENT" | "LAWYER" | "ADMIN";

const clientNav = [
  { href: "/client/dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { href: "/client/lawyers",       label: "Browse Lawyers", icon: Users           },
  { href: "/client/appointments",  label: "Appointments",   icon: CalendarDays    },
  { href: "/client/conversations", label: "Messages",       icon: MessageSquare   },
  { href: "/client/analysis",      label: "Doc Analysis",   icon: FileSearch      },
];

const lawyerNav = [
  { href: "/lawyer/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { href: "/lawyer/profile",       label: "My Profile",   icon: UserCircle      },
  { href: "/lawyer/appointments",  label: "Appointments", icon: CalendarDays    },
  { href: "/lawyer/conversations", label: "Messages",     icon: MessageSquare   },
];

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard",          icon: LayoutDashboard },
  { href: "/admin/lawyers",   label: "Lawyer Verification", icon: ShieldCheck     },
  { href: "/admin/users",     label: "Users",               icon: Users           },
  { href: "/admin/reviews",   label: "Reviews",             icon: Star            },
];

const navByRole: Record<Role, typeof clientNav> = {
  CLIENT: clientNav,
  LAWYER: lawyerNav,
  ADMIN:  adminNav,
};

const profileHrefByRole: Record<Role, string | null> = {
  CLIENT: "/client/profile",
  LAWYER: "/lawyer/profile",
  ADMIN:  null,
};

interface SidebarProps { role: Role }

export function Sidebar({ role }: SidebarProps) {
  const pathname          = usePathname();
  const router            = useRouter();
  const { data: session } = useSession();
  const navItems          = navByRole[role];
  const profileHref       = profileHrefByRole[role];

  // Profile picture — stored in Zustand so the edit page can update it
  // instantly without requiring a full reload.
  const storedPhotoUrl      = useAuthStore((s) => s.profilePictureUrl);
  const setProfilePictureUrl = useAuthStore((s) => s.setProfilePictureUrl);

  useEffect(() => {
    const sub = session?.user?.sub;
    // Only fetch if the store hasn't been populated yet for this user
    if (!sub || storedPhotoUrl !== null) return;

    fetch(`/api/users/${sub}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { profilePictureUrl?: string } | null) => {
        setProfilePictureUrl(toAvatarUrl(data?.profilePictureUrl));
      })
      .catch(() => {});
  }, [session?.user?.sub, storedPhotoUrl, setProfilePictureUrl]);

  const photoUrl = storedPhotoUrl;

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0]?.replace(/[._-]/g, " ") ||
    role;

  const email = session?.user?.email ?? "";

  async function handleLogout() {
    const logoutUrl = session?.keycloakLogoutUrl;
    // Clear the local Auth.js session without auto-redirecting
    await signOut({ redirect: false });
    // Then send the browser to Keycloak's end_session endpoint so the SSO
    // session is also terminated. Fall back to "/" if the URL isn't available
    // (e.g. id_token was not stored).
    window.location.href = logoutUrl ?? "/";
  }

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

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-800 focus:outline-none">
          {/* Avatar */}
          <UserAvatar
            name={displayName}
            photoUrl={photoUrl}
            size="sm"
            colorClass="bg-blue-600 text-white"
          />

          {/* Name + email */}
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium capitalize">{displayName}</p>
            <p className="truncate text-xs text-gray-400">{email}</p>
          </div>

          <ChevronUp className="size-4 shrink-0 text-gray-500" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          alignOffset={8}
          sideOffset={4}
          className="w-56 border border-gray-700 bg-gray-800 text-gray-100 shadow-xl"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium capitalize">{displayName}</p>
            <p className="truncate text-xs text-gray-400">{email}</p>
          </div>

          <DropdownMenuSeparator className="bg-gray-700" />

          {profileHref && (
            <DropdownMenuItem
              className="cursor-pointer gap-2 px-3 py-2 text-gray-200 focus:bg-gray-700 focus:text-white"
              onClick={() => router.push(profileHref)}
            >
              <UserCircle className="size-4 shrink-0" />
              My Profile
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-gray-700" />

          <DropdownMenuItem
            className="cursor-pointer gap-2 px-3 py-2 text-red-400 focus:bg-gray-700 focus:text-red-300"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  );
}
