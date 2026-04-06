"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/auth");
      return;
    }

    // Redirect to role-specific dashboard
    if (user.role === "creator") {
      router.replace("/dashboard/creator");
    } else {
      router.replace("/dashboard/freelancer");
    }
  }, [user, loading, router]);

  // Show loading while redirecting
  return (
    <div className="flex-1">
      <div className="animate-pulse space-y-6 p-4">
        <div className="h-36 bg-vault-text-muted/10 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-vault-text-muted/10 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
