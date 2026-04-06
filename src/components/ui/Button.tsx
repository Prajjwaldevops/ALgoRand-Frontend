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
      "bg-gradient-to-r from-vault-purple to-vault-cyan text-white hover:shadow-[0_0_30px_rgba(124,92,252,0.4)] hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "glass-card text-vault-text hover:border-vault-purple/40 hover:shadow-[0_0_20px_rgba(124,92,252,0.15)]",
    ghost:
      "text-vault-text-secondary hover:text-vault-text hover:bg-white/5 rounded-lg",
    danger:
      "bg-vault-red/10 text-vault-red border border-vault-red/20 hover:bg-vault-red/20 hover:border-vault-red/40",
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
