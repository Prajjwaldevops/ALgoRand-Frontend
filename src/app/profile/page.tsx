"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, type Profile } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { truncateAddress } from "@/lib/utils";
import {
  Wallet, Star, Briefcase, CheckCircle, Edit3,
  LogOut, Save, X, Shield,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const clerk = useClerk();
  // Use AuthContext so we don't race against the Clerk token being available.
  // AuthContext already handles token readiness and full loading state.
  const { user: ctxUser, loading: ctxLoading, clerkSignedIn, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: "", bio: "", wallet_address: "" });

  // Mirror AuthContext user into local state once it's ready
  useEffect(() => {
    if (ctxLoading) return;
    if (!ctxUser) {
      // If Clerk says we're signed in but profile hasn't loaded yet
      // (token propagation race after setActive), don't redirect yet.
      if (clerkSignedIn) return;
      router.replace("/auth");
      return;
    }
    setProfile(ctxUser as Profile);
    setEditForm({
      display_name: ctxUser.display_name || "",
      bio: ctxUser.bio || "",
      wallet_address: ctxUser.wallet_address || "",
    });
  }, [ctxUser, ctxLoading, clerkSignedIn, router]);

  // Show loading skeleton while context is loading OR when Clerk says signed-in
  // but the profile fetch hasn't returned yet (token propagation race).
  const loading = ctxLoading || (clerkSignedIn && !ctxUser);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile(editForm);
      if (res.success && res.data) {
        setProfile(res.data);
        setEditing(false);
        // Keep AuthContext in sync so dashboard/header reflect the new data
        await refreshUser();
      }
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await clerk.signOut();
    router.push("/");
  };

  const connectWallet = async () => {
    try {
      const { PeraWalletConnect } = await import("@perawallet/connect");
      const peraWallet = new PeraWalletConnect();
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        const addr = accounts[0];
        localStorage.setItem("bv_wallet", addr);
        setEditForm((f) => ({ ...f, wallet_address: addr }));
        // Also update on backend
        await authApi.updateProfile({ wallet_address: addr });
        if (profile) {
          setProfile({ ...profile, wallet_address: addr });
        }
      }
    } catch (err: unknown) {
      const error = err as { data?: { type?: string }; message?: string };
      // User closed the Pera Wallet modal — silently ignore
      if (
        error?.data?.type === "CONNECT_MODAL_CLOSED" ||
        (error?.message && /close|cancel|reject/i.test(error.message))
      ) {
        return;
      }
      console.error("Wallet connection failed:", err);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#ef233c]/40 transition-colors placeholder:text-zinc-600";

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-white/5 rounded-xl" />
            <div className="h-48 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <ScrollReveal>
          <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#ef233c] to-red-900 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#ef233c]/20">
                {profile.username?.charAt(0).toUpperCase() || "U"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold font-[var(--font-heading)] text-white">
                    {profile.display_name || profile.username}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#ef233c]/10 text-red-300 text-xs font-medium capitalize">
                    {profile.role}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-3">@{profile.username}</p>

                {profile.wallet_address ? (
                  <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                    <Wallet className="w-3.5 h-3.5 text-[#ef233c]" />
                    <span className="text-xs font-mono text-zinc-400">
                      {truncateAddress(profile.wallet_address, 6)}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" onClick={connectWallet}>
                    <Wallet className="w-3.5 h-3.5" />
                    Connect Wallet
                  </Button>
                )}
              </div>

              <div className="flex gap-2 self-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay={0.1}>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-4 text-center">
              <Star className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold font-[var(--font-heading)] text-white">
                {profile.reputation_score}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Reputation</p>
            </div>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-4 text-center">
              <Briefcase className="w-5 h-5 text-[#ef233c] mx-auto mb-2" />
              <div className="text-2xl font-bold font-[var(--font-heading)] text-white">
                {profile.total_bounties_created}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Created</p>
            </div>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-4 text-center">
              <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold font-[var(--font-heading)] text-white">
                {profile.total_bounties_completed}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Completed</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Edit Form / Bio */}
        <ScrollReveal delay={0.2}>
          {editing ? (
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-white">
                <Edit3 className="w-4 h-4 text-[#ef233c]" />
                Edit Profile
              </h2>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Display Name</label>
                <input
                  id="edit-display-name"
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Bio</label>
                <textarea
                  id="edit-bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  className={`${inputClass} resize-none h-24`}
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Wallet Address</label>
                <div className="flex gap-2">
                  <input
                    id="edit-wallet"
                    type="text"
                    value={editForm.wallet_address}
                    onChange={(e) => setEditForm((f) => ({ ...f, wallet_address: e.target.value }))}
                    placeholder="ALGO..."
                    className={`flex-1 ${inputClass} font-mono`}
                  />
                  <Button variant="secondary" size="sm" onClick={connectWallet}>
                    <Wallet className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>
                  <Save className="w-4 h-4" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3 text-white">
                <Shield className="w-4 h-4 text-[#ef233c]" />
                About
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {profile.bio || "No bio set. Click the edit button to add one."}
              </p>
            </div>
          )}
        </ScrollReveal>
      </div>
    </div>
  );
}
