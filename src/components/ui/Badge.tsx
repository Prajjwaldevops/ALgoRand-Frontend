"use client";

import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";
import { statusLabel } from "@/lib/utils";

interface BadgeProps {
  status?: string;
  tag?: string;
  className?: string;
}

export function Badge({ status, tag, className }: BadgeProps) {
  if (tag) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          "bg-[#ef233c]/10 text-red-300 border border-[#ef233c]/20",
          className
        )}
      >
        {tag}
      </span>
    );
  }

  if (status) {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.open;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
          colors.bg,
          colors.text,
          "border border-current/10",
          className
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
        {statusLabel(status)}
      </span>
    );
  }

  return null;
}
