"use client";

import { useState } from "react";
import { getInitials } from "@/lib/display";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "size-8  text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-16 text-xl",
} as const;

interface UserAvatarProps {
  /** Display name used to generate fallback initials */
  name: string;
  /** BFF-ready URL  (e.g. /api/uploads/profile-pictures/abc.jpg) */
  photoUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  /** Override the fallback background + text colours (Tailwind classes) */
  colorClass?: string;
}

/**
 * Circular avatar that shows a profile picture when available and falls
 * back to a coloured initials badge otherwise.
 */
export function UserAvatar({
  name,
  photoUrl,
  size = "md",
  className,
  colorClass = "bg-blue-100 text-blue-700",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = SIZE_CLASSES[size];
  const initials  = getInitials(name) || "?";

  const showImage = !!photoUrl && !imgError;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        sizeClass,
        !showImage && colorClass,
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-bold">
          {initials}
        </span>
      )}
    </div>
  );
}
