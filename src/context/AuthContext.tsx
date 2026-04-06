"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { authApi, Profile, setClerkTokenGetter } from "@/lib/api";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/nextjs";

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  /** True when Clerk itself reports a signed-in session, even if our profile is still loading */
  clerkSignedIn: boolean;
  logoutUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Directly set user profile (used after explicit sync during sign-up) */
  setUserDirect: (profile: Profile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  clerkSignedIn: false,
  logoutUser: async () => {},
  refreshUser: async () => {},
  setUserDirect: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Counter to prevent stale background refreshes from overwriting fresh data
  const refreshCounter = useRef(0);

  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useClerkAuth();
  const { signOut } = useClerk();

  // Inject the Clerk getToken into the API layer once
  useEffect(() => {
    setClerkTokenGetter(() => getToken());
  }, [getToken]);

  const logoutUser = useCallback(async () => {
    await signOut();
    refreshCounter.current++;
    setUser(null);
  }, [signOut]);

  /**
   * Directly set user profile — bypasses the API and invalidates any
   * in-flight background refreshes. Used by the sign-up flow after
   * explicit sync so the correct role is immediately visible.
   */
  const setUserDirect = useCallback((profile: Profile) => {
    refreshCounter.current++;
    setUser(profile);
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!clerkLoaded) return;

    if (!clerkUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const thisRefresh = ++refreshCounter.current;

    try {
      // Only read from backend — never auto-provision here.
      // Profile creation is handled exclusively by the sign-up flow.
      const res = await authApi.me();

      // If a newer refresh or setUserDirect was called while we were waiting,
      // discard this result to avoid overwriting fresher data.
      if (thisRefresh !== refreshCounter.current) return;

      if (res.success && res.data) {
        setUser(res.data);
      } else {
        // Profile doesn't exist in backend yet.
        // Safe fallback for username to avoid UNIQUE constraint conflicts
        const baseUsername = clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] || "user";
        const safeUsername = `${baseUsername}_${clerkUser.id.substring(clerkUser.id.length - 4)}`;

        const syncRes = await authApi.sync(
          clerkUser.primaryEmailAddress?.emailAddress || "unknown@bountyvault.com",
          safeUsername,
          "freelancer", // Default role
          clerkUser.firstName || "",
          clerkUser.lastName || ""
        );
        
        if (thisRefresh !== refreshCounter.current) return;
        
        if (syncRes.success && syncRes.data) {
          setUser(syncRes.data as Profile);
        } else {
          console.error("Auto-sync failed:", syncRes.error);
          setUser(null);
        }
      }
    } catch (err) {
      if (thisRefresh !== refreshCounter.current) return;
      console.error("Auth context failed to load user profile", err);
      setUser(null);
    } finally {
      if (thisRefresh === refreshCounter.current) {
        setLoading(false);
      }
    }
  }, [clerkUser, clerkLoaded]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const clerkSignedIn = clerkLoaded && !!clerkUser;

  return (
    <AuthContext.Provider value={{ user, loading: loading || !clerkLoaded, clerkSignedIn, logoutUser, refreshUser, setUserDirect }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
