"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, AlertCircle, RefreshCw } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "creator" | "freelancer";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, clerkSignedIn, refreshUser } = useAuth();
  const router = useRouter();
  // Timeout: after 8 seconds of loading with no user, show error state
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Start a timeout whenever loading is true
    if (loading || (clerkSignedIn && !user)) {
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          setTimedOut(true);
        }, 8000);
      }
    } else {
      // Clear timeout when loading resolves
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setTimedOut(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [loading, clerkSignedIn, user]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      // If we've finished loading but still have no profile, 
      // definitively redirect to auth flow. In AuthContext we explicitly 
      // wait for sync finish before setting loading false.
      router.replace("/auth");
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      if (user.role === "creator") {
        router.replace("/dashboard/creator");
      } else {
        router.replace("/dashboard/freelancer");
      }
    }
  }, [user, loading, clerkSignedIn, requiredRole, router]);

  // Timed out — show error state instead of infinite spinner
  if (timedOut && !user) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-10 text-center max-w-md rounded-xl">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-[var(--font-heading)] mb-2 text-white">
            Dashboard Loading Issue
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            We couldn&apos;t load your profile. This may be because the backend is
            not running or your session expired.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setTimedOut(false);
                refreshUser();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef233c] text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={() => router.replace("/auth")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-zinc-400 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (loading || (clerkSignedIn && !user)) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-36 bg-white/5 rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-white/5 rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-10 text-center max-w-md rounded-xl">
          <User className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-[var(--font-heading)] mb-2 text-white">
            Sign in Required
          </h2>
          <p className="text-sm text-zinc-400 mb-6">
            You need to sign in to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Wrong role
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
