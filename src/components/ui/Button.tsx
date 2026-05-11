"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  id?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  disabled,
  loading,
  type = "button",
  id,
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-[#ef233c] text-white hover:bg-red-700 hover:shadow-[0_0_30px_rgba(239,35,60,0.3)] hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(239,35,60,0.1)]",
    ghost:
      "text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg",
    danger:
      "bg-red-900/20 text-red-400 border border-red-800/40 hover:bg-red-900/30 hover:border-red-700/50",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm gap-1.5",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-4 text-base gap-2.5",
  };

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
