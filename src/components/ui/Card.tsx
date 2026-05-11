"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: "purple" | "cyan" | "magenta" | "red" | "none";
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
    purple: "hover:shadow-[0_0_30px_rgba(239,35,60,0.1)]",
    cyan: "hover:shadow-[0_0_30px_rgba(239,35,60,0.1)]",
    magenta: "hover:shadow-[0_0_30px_rgba(239,35,60,0.1)]",
    red: "hover:shadow-[0_0_30px_rgba(239,35,60,0.1)]",
    none: "",
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        "border border-white/10 bg-zinc-900/50 backdrop-blur-sm rounded-xl transition-all duration-400 p-6",
        hover && "cursor-pointer hover:border-white/20 hover:-translate-y-0.5",
        glowStyles[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
