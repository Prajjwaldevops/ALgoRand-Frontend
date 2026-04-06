"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: "purple" | "cyan" | "magenta" | "none";
  hover?: boolean;
  onClick?: () => void;
  id?: string;
}

export function Card({
  children,
  className,
  glow = "none",
  hover = true,
  onClick,
  id,
}: CardProps) {
  const glowStyles = {
    purple: "hover:shadow-[0_0_40px_rgba(124,92,252,0.12)]",
    cyan: "hover:shadow-[0_0_40px_rgba(34,211,238,0.12)]",
    magenta: "hover:shadow-[0_0_40px_rgba(224,64,224,0.12)]",
    none: "",
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        "glass-card p-6",
        hover && "cursor-pointer",
        glowStyles[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
