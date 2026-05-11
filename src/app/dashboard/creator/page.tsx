"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  dashboardApi,
  notificationApi,
  type DashboardStats,
  type DashboardBounty,
  type Notification,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import {
  Briefcase, TrendingUp, Plus, Bell, BellOff, Clock,
  ArrowRight, Wallet, BarChart3, DollarSign, ShieldAlert,
  Activity, Zap, HandshakeIcon,
} from "lucide-react";

const MOCK_STATS: DashboardStats = {
  reputation_score: 0, total_bounties_created: 0, total_bounties_completed: 0,
  total_earnings_algo: 0, streak_count: 0, avg_rating: 0, total_ratings: 0,
  active_bounties: 0, active_submissions: 0, total_submissions: 0,
  approved_submissions: 0, win_rate: 0, unread_notifications: 0,
  total_spent_algo: 0, open_disputes: 0, working_bounties: 0,
  pending_acceptances: 0, role: "creator",
};

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [bounties, setBounties] = useState<DashboardBounty[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, bountiesRes, notifsRes] = await Promise.allSettled([
        dashboardApi.stats(),
        dashboardApi.myBounties(),
        notificationApi.list(),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value.success && statsRes.value.data)
        setStats(statsRes.value.data);
      if (bountiesRes.status === "fulfilled" && bountiesRes.value.success && bountiesRes.value.data)
        setBounties(bountiesRes.value.data);
      if (notifsRes.status === "fulfilled" && notifsRes.value.success && notifsRes.value.data)
        setNotifications(notifsRes.value.data);
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkRead = async () => {
    await notificationApi.markRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setStats((prev) => ({ ...prev, unread_notifications: 0 }));
  };

  const statCards = [
    { icon: Briefcase, label: "Bounties Created", value: stats.total_bounties_created, color: "text-[#ef233c]", bg: "bg-[#ef233c]/10" },
    { icon: Zap, label: "Active Bounties", value: stats.active_bounties, color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: DollarSign, label: "Total Spent", value: `${stats.total_spent_algo.toFixed(1)}`, suffix: "ALGO", color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: HandshakeIcon, label: "Pending Requests", value: stats.pending_acceptances, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: ShieldAlert, label: "Open Disputes", value: stats.open_disputes, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-4">
        <div className="h-36 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Welcome Hero */}
      <ScrollReveal>
        <div className="relative border border-white/10 bg-zinc-900/50 rounded-xl p-6 sm:p-8 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#ef233c]/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-[#ef233c]/5 blur-[60px] pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#ef233c] to-red-900 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#ef233c]/20">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                (user?.first_name || user?.display_name || user?.username)?.charAt(0).toUpperCase() || "C"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] mb-1 text-white">
                Welcome back
                <span className="gradient-text">
                  , {user?.first_name || user?.display_name || user?.username}
                </span>{" "}
                🎯
              </h1>
              <p className="text-sm text-zinc-400">
                Creator Dashboard — Manage your bounties and track submissions
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.wallet_address ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400">
                  <Wallet className="w-3 h-3 text-[#ef233c]" />
                  Connected
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
              ) : (
                <Link href="/auth/link-wallet">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-amber-400 cursor-pointer hover:bg-white/10 transition-colors">
                    <Wallet className="w-3 h-3" />
                    Connect Wallet
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Stats */}
      <ScrollReveal delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <div
              key={stat.label}
              className="border border-white/10 bg-zinc-900/50 p-4 rounded-xl text-center group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-xl font-bold font-[var(--font-heading)] text-white">
                {stat.value}
                {stat.suffix && <span className="text-xs text-zinc-500 ml-1">{stat.suffix}</span>}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Quick Actions */}
      <ScrollReveal delay={0.15}>
        <div className="flex flex-wrap gap-3">
          <Link href="/create">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" /> Create Bounty
            </Button>
          </Link>
          <Link href="/dashboard/creator/bounties">
            <Button variant="secondary" size="sm">
              <Briefcase className="w-4 h-4" /> My Bounties
            </Button>
          </Link>
          <Link href="/dashboard/creator/acceptances">
            <Button variant="secondary" size="sm">
              <HandshakeIcon className="w-4 h-4" /> Review Acceptances
              {stats.pending_acceptances > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                  {stats.pending_acceptances}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/dashboard/creator/status">
            <Button variant="ghost" size="sm">
              <Activity className="w-4 h-4" /> Bounty Status
            </Button>
          </Link>
        </div>
      </ScrollReveal>

      {/* Recent Bounties */}
      <ScrollReveal delay={0.2}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-[var(--font-heading)] text-white">Recent Bounties</h2>
          <Link href="/dashboard/creator/bounties" className="text-sm text-[#ef233c] hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {bounties.length === 0 ? (
          <div className="border border-white/10 bg-zinc-900/50 p-10 text-center rounded-xl">
            <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">No bounties yet</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Create your first bounty and start getting work done!
            </p>
            <Link href="/create">
              <Button variant="primary">
                <Plus className="w-4 h-4" /> Create Bounty
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bounties.slice(0, 6).map((bounty, i) => (
              <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                <div
                  className="border border-white/10 bg-zinc-900/50 p-5 rounded-xl flex flex-col group cursor-pointer h-full hover:border-white/20 transition-all"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge status={bounty.status} />
                    <span className="text-lg font-bold font-[var(--font-heading)] gradient-text">
                      {formatAlgo(bounty.reward_algo)} <span className="text-xs">ALGO</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold mb-2 group-hover:text-[#ef233c] transition-colors line-clamp-2 text-white">
                    {bounty.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mb-3 line-clamp-2 flex-1">
                    {bounty.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDeadline(bounty.deadline)}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" />
                      {bounty.submission_count}/{bounty.max_submissions} subs
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ScrollReveal>

      {/* Notifications */}
      {notifications.length > 0 && (
        <ScrollReveal delay={0.25}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-[var(--font-heading)] flex items-center gap-2 text-white">
              <Bell className="w-5 h-5 text-amber-400" />
              Notifications
              {stats.unread_notifications > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                  {stats.unread_notifications}
                </span>
              )}
            </h2>
            {notifications.some((n) => !n.is_read) && (
              <Button variant="ghost" size="sm" onClick={handleMarkRead}>
                <BellOff className="w-4 h-4" /> Mark all read
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notif, i) => (
              <div
                key={notif.id}
                className={`border border-white/10 bg-zinc-900/50 p-4 rounded-xl flex items-start gap-3 transition-all ${
                  !notif.is_read ? "border-[#ef233c]/30 bg-[#ef233c]/5" : ""
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="mt-1.5 flex-shrink-0">
                  {!notif.is_read ? (
                    <span className="block w-2 h-2 rounded-full bg-[#ef233c] animate-pulse" />
                  ) : (
                    <span className="block w-2 h-2 rounded-full bg-zinc-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">{notif.title}</span>
                  <p className="text-xs text-zinc-400 line-clamp-1">{notif.message}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
                {notif.bounty_id && (
                  <Link href={`/bounties/${notif.bounty_id}`} className="flex-shrink-0 text-[#ef233c] hover:text-red-400">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
