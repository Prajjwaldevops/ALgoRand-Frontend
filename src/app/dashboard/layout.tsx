"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen pt-20 pb-10">
        {/* Mobile hamburger button */}
        <div className="lg:hidden sticky top-20 z-30 px-4 py-2">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Menu className="w-5 h-5" />
            <span className="text-sm font-medium">Menu</span>
          </button>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex gap-6">
          <DashboardSidebar
            isMobileOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
