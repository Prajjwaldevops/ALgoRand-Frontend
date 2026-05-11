"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  dashboardApi, notificationApi,
  type DashboardStats, type DashboardSubmission, type WorkingBounty, type Notification,
} from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import {
  Star, CheckCircle, TrendingUp, Target, Flame, Search,
  Bell, BellOff, Clock, ArrowRight, Wallet, Zap,
  FileCheck, ShieldAlert, ExternalLink, HandshakeIcon,
} from "lucide-react";

const MOCK_STATS: DashboardStats = {
  reputation_score: 0, total_bounties_created: 0, total_bounties_completed: 0,
  total_earnings_algo: 0, streak_count: 0, avg_rating: 0, total_ratings: 0,
  active_bounties: 0, active_submissions: 0, total_submissions: 0,
  approved_submissions: 0, win_rate: 0, unread_notifications: 0,
  total_spent_algo: 0, open_disputes: 0, working_bounties: 0,
  pending_acceptances: 0, role: "freelancer",
};

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [workingBounties, setWorkingBounties] = useState<WorkingBounty[]>([]);
  const [submissions, setSubmissions] = useState<DashboardSubmission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"working" | "submissions">("working");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, workingRes, subsRes, notifsRes] = await Promise.allSettled([
        dashboardApi.stats(),
        dashboardApi.workingBounties(),
        dashboardApi.mySubmissions(),
        notificationApi.list(),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value.success && statsRes.value.data)
        setStats(statsRes.value.data);
      if (workingRes.status === "fulfilled" && workingRes.value.success && workingRes.value.data)
        setWorkingBounties(workingRes.value.data);
      if (subsRes.status === "fulfilled" && subsRes.value.success && subsRes.value.data)
        setSubmissions(subsRes.value.data);
      if (notifsRes.status === "fulfilled" && notifsRes.value.success && notifsRes.value.data)
        setNotifications(notifsRes.value.data);
    } catch { /* defaults */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkRead = async () => {
    await notificationApi.markRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setStats((prev) => ({ ...prev, unread_notifications: 0 }));
  };

  const statCards = [
    { icon: Star, label: "Reputation", value: stats.reputation_score, color: "text-amber-400", bg: "bg-amber-500/10" },
    { icon: CheckCircle, label: "Completed", value: stats.total_bounties_completed, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { icon: TrendingUp, label: "Earnings", value: `${stats.total_earnings_algo.toFixed(1)}`, suffix: "ALGO", color: "text-blue-400", bg: "bg-blue-500/10" },
    { icon: Target, label: "Win Rate", value: `${stats.win_rate.toFixed(0)}%`, color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: Zap, label: "Working", value: stats.working_bounties, color: "text-[#ef233c]", bg: "bg-[#ef233c]/10" },
    { icon: Flame, label: "Streak", value: stats.streak_count, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-4">
        <div className="h-36 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
                (user?.first_name || user?.display_name || user?.username)?.charAt(0).toUpperCase() || "F"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] mb-1 text-white">
                Welcome back
                <span className="gradient-text">
                  , {user?.first_name || user?.display_name || user?.username}
                </span>{" "}
                🛠️
              </h1>
              <p className="text-sm text-zinc-400">
                Freelancer Dashboard — Find bounties and track your work
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.wallet_address ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400">
                  <Wallet className="w-3 h-3 text-[#ef233c]" />Connected
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </span>
              ) : (
                <Link href="/auth/link-wallet">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-amber-400 cursor-pointer hover:bg-white/10 transition-colors">
                    <Wallet className="w-3 h-3" />Connect Wallet
                  </span>
                </Link>
              )}
              {stats.active_submissions > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#ef233c]">
                  <Clock className="w-3 h-3" />{stats.active_submissions} Pending
                </span>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Stats Grid */}
      <ScrollReveal delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, i) => (
            <div key={stat.label} className="border border-white/10 bg-zinc-900/50 p-4 rounded-xl text-center group" style={{ animationDelay: `${i * 80}ms` }}>
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
          <Link href="/bounties">
            <Button variant="primary" size="sm"><Search className="w-4 h-4" /> Browse Bounties</Button>
          </Link>
          <Link href="/dashboard/freelancer/acceptances">
            <Button variant="secondary" size="sm">
              <HandshakeIcon className="w-4 h-4" /> My Acceptances
              {stats.pending_acceptances > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  {stats.pending_acceptances}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/dashboard/freelancer/working">
            <Button variant="secondary" size="sm"><Zap className="w-4 h-4" /> Working Bounties</Button>
          </Link>
          <Link href="/dashboard/freelancer/status">
            <Button variant="ghost" size="sm"><FileCheck className="w-4 h-4" /> Update Status</Button>
          </Link>
        </div>
      </ScrollReveal>

      {/* Tabs */}
      <ScrollReveal delay={0.2}>
        <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded-xl w-fit">
          {[
            { key: "working" as const, label: "Working Bounties", icon: Zap, count: workingBounties.length },
            { key: "submissions" as const, label: "Recent Submissions", icon: FileCheck, count: submissions.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[#ef233c] text-white shadow-lg shadow-[#ef233c]/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-[#ef233c]/10 text-[#ef233c]"
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Tab Content */}
      {activeTab === "working" && (
        <ScrollReveal delay={0.05}>
          {workingBounties.length === 0 ? (
            <div className="border border-white/10 bg-zinc-900/50 p-10 text-center rounded-xl">
              <Zap className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No active work</h3>
              <p className="text-sm text-zinc-400 mb-6">Browse open bounties and submit your work to get started.</p>
              <Link href="/bounties"><Button variant="primary"><Search className="w-4 h-4" /> Browse Bounties</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workingBounties.map((bounty, i) => (
                <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                  <div className="border border-white/10 bg-zinc-900/50 p-5 rounded-xl group cursor-pointer h-full hover:border-white/20 transition-all" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-start justify-between mb-3">
                      <Badge status={bounty.status} />
                      <span className="text-lg font-bold gradient-text">{formatAlgo(bounty.reward_algo)} <span className="text-xs">ALGO</span></span>
                    </div>
                    <h3 className="text-sm font-semibold mb-1 group-hover:text-[#ef233c] transition-colors line-clamp-1 text-white">{bounty.title}</h3>
                    <p className="text-xs text-zinc-500 mb-3">by {bounty.creator_username}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-medium ${
                        bounty.submission_status === "approved" ? "bg-emerald-500/10 text-emerald-400"
                          : bounty.submission_status === "rejected" ? "bg-red-500/10 text-red-400"
                          : bounty.submission_status === "pending" ? "bg-amber-500/10 text-amber-400"
                          : "bg-[#ef233c]/10 text-[#ef233c]"
                      }`}>
                        {bounty.submission_status === "none"
                          ? "Work: Pending"
                          : `Submission: ${bounty.submission_status}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/10">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDeadline(bounty.deadline)}</span>
                      <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />View</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollReveal>
      )}

      {activeTab === "submissions" && (
        <ScrollReveal delay={0.05}>
          {submissions.length === 0 ? (
            <div className="border border-white/10 bg-zinc-900/50 p-10 text-center rounded-xl">
              <FileCheck className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No submissions yet</h3>
              <p className="text-sm text-zinc-400 mb-6">Browse open bounties and submit your work to earn ALGO.</p>
              <Link href="/bounties"><Button variant="primary"><Search className="w-4 h-4" /> Browse Bounties</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub, i) => (
                <Link key={sub.id} href={`/bounties/${sub.bounty_id}`}>
                  <div className="border border-white/10 bg-zinc-900/50 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 group cursor-pointer hover:border-white/20 transition-all" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        sub.status === "approved" ? "bg-emerald-500/10" : sub.status === "rejected" ? "bg-red-500/10" : "bg-amber-500/10"
                      }`}>
                        {sub.status === "approved" ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                          : sub.status === "rejected" ? <ShieldAlert className="w-5 h-5 text-red-400" />
                          : <Clock className="w-5 h-5 text-amber-400" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold group-hover:text-[#ef233c] transition-colors line-clamp-1 text-white">{sub.bounty_title}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Submitted {new Date(sub.submitted_at).toLocaleDateString()} · <span className="capitalize">{sub.status}</span>
                      </p>
                      {sub.feedback && <p className="text-xs text-zinc-400 mt-1 line-clamp-1 italic">&quot;{sub.feedback}&quot;</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-bold gradient-text">{formatAlgo(sub.bounty_reward)} ALGO</span>
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1 justify-end"><ExternalLink className="w-3 h-3" />View</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollReveal>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <ScrollReveal delay={0.25}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-[var(--font-heading)] flex items-center gap-2 text-white">
              <Bell className="w-5 h-5 text-amber-400" /> Notifications
              {stats.unread_notifications > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">{stats.unread_notifications}</span>
              )}
            </h2>
            {notifications.some((n) => !n.is_read) && (
              <Button variant="ghost" size="sm" onClick={handleMarkRead}><BellOff className="w-4 h-4" /> Mark read</Button>
            )}
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notif, i) => (
              <div key={notif.id} className={`border border-white/10 bg-zinc-900/50 p-4 rounded-xl flex items-start gap-3 ${!notif.is_read ? "border-[#ef233c]/30 bg-[#ef233c]/5" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="mt-1.5 flex-shrink-0">
                  {!notif.is_read ? <span className="block w-2 h-2 rounded-full bg-[#ef233c] animate-pulse" /> : <span className="block w-2 h-2 rounded-full bg-zinc-700" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">{notif.title}</span>
                  <p className="text-xs text-zinc-400 line-clamp-1">{notif.message}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
                {notif.bounty_id && (
                  <Link href={`/bounties/${notif.bounty_id}`} className="flex-shrink-0 text-[#ef233c] hover:text-red-400"><ArrowRight className="w-4 h-4" /></Link>
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
