"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { dashboardApi, bountyApi, type WorkingBounty } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import {
  Zap,
  Clock,
  ArrowLeft,
  Upload,
  RefreshCw,
  ShieldAlert,
  HandCoins,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Timer,
  Hash,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Eye,
} from "lucide-react";

/* ──────────────────────────────────────────────
   Live Countdown Timer with urgency coloring
   ────────────────────────────────────────────── */
function DeadlineTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [urgency, setUrgency] = useState<"safe" | "warning" | "critical" | "expired">("safe");

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        setUrgency("expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 3) setUrgency("safe");
      else if (days > 0) setUrgency("warning");
      else setUrgency("critical");

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
      setIsExpired(false);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const urgencyStyles = {
    safe: "text-emerald-400 bg-emerald-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    critical: "text-red-400 bg-red-500/10 animate-pulse",
    expired: "text-red-500 bg-red-500/10",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${urgencyStyles[urgency]}`}
    >
      <Timer className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Submission Progress Bar
   ────────────────────────────────────────────── */
function SubmissionProgress({
  count,
  max,
  remaining,
}: {
  count: number;
  max: number;
  remaining: number;
}) {
  const pct = max > 0 ? Math.min(100, (count / max) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] text-zinc-500">
        <span>
          {count}/{max} submissions
        </span>
        <span
          className={remaining <= 1 ? "text-red-400 font-medium" : "text-zinc-500"}
        >
          {remaining} slot{remaining !== 1 ? "s" : ""} left
        </span>
      </div>
      <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ef233c] to-[#ff6b81] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Status Chip (more visual than plain text)
   ────────────────────────────────────────────── */
function SubmissionStatusChip({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    approved: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: "Approved",
      cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    rejected: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: "Rejected",
      cls: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    pending: {
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      label: "Awaiting Review",
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    none: {
      icon: <Upload className="w-3.5 h-3.5" />,
      label: "Not Submitted",
      cls: "bg-[#ef233c]/10 text-[#ef233c] border-[#ef233c]/20",
    },
  };

  const c = config[status] || config.none;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${c.cls}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

/* ──────────────────────────────────────────────
   Main Page Component
   ────────────────────────────────────────────── */
export default function WorkingBountiesPage() {
  const [bounties, setBounties] = useState<WorkingBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [letGoConfirm, setLetGoConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.workingBounties();
      if (res.success && res.data) setBounties(res.data);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLetGo = async (bountyId: string) => {
    setActionLoading(bountyId);
    try {
      const res = await bountyApi.letGo(bountyId);
      if (res.success) {
        fetchData();
        setLetGoConfirm(null);
      }
    } catch {
      /* */
    } finally {
      setActionLoading(null);
    }
  };

  /* ─── Loading Skeletons ─── */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-5">
        <div className="h-10 bg-white/5 rounded-2xl w-56 animate-pulse" />
        <div className="h-4 bg-white/[0.03] rounded w-72 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass rounded-2xl p-6 animate-pulse space-y-3"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex gap-2">
              <div className="h-5 bg-white/[0.06] rounded-full w-20" />
              <div className="h-5 bg-white/[0.06] rounded-lg w-28" />
            </div>
            <div className="h-5 bg-white/[0.06] rounded w-3/4" />
            <div className="h-3 bg-white/[0.04] rounded w-full" />
            <div className="h-1 bg-white/[0.04] rounded-full w-full" />
            <div className="flex gap-2">
              <div className="h-8 bg-white/[0.06] rounded-xl w-28" />
              <div className="h-8 bg-white/[0.04] rounded-xl w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-1">
          <Link href="/dashboard/freelancer">
            <button className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-[#ef233c]/10 hover:border-[#ef233c]/20 transition-all duration-300">
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-[var(--font-heading)]">
                Working{" "}
                <span className="gradient-text">Bounties</span>
              </h1>
              {bounties.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#ef233c]/10 text-[#ef233c] text-xs font-semibold">
                  {bounties.length}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">
              Track your assigned bounties, submit work, and monitor progress
            </p>
          </div>
          <button
            onClick={fetchData}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-[#ef233c]/10 hover:border-[#ef233c]/20 transition-all duration-300 group"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400 group-hover:text-[#ef233c] transition-colors" />
          </button>
        </div>
      </ScrollReveal>

      {/* Empty State */}
      {bounties.length === 0 ? (
        <ScrollReveal delay={0.05}>
          <div className="glass rounded-2xl p-12 text-center relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#ef233c]/[0.03] rounded-full blur-[80px] pointer-events-none" />

            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <Zap className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-[var(--font-heading)]">
                No assigned bounties yet
              </h3>
              <p className="text-sm text-zinc-500 mb-8 max-w-md mx-auto leading-relaxed">
                Apply to bounties and get accepted by creators to start working.
                Once accepted, your bounties will appear here.
              </p>
              <Link href="/bounties">
                <Button variant="primary" size="md">
                  <Sparkles className="w-4 h-4" />
                  Browse Open Bounties
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      ) : (
        /* ─── Bounty Cards ─── */
        <div className="space-y-4">
          {bounties.map((bounty, i) => (
            <ScrollReveal key={bounty.id} delay={i * 0.05}>
              <div className="glass rounded-2xl overflow-hidden group">
                {/* Top accent — color-coded by submission status */}
                <div
                  className={`h-[2px] ${
                    bounty.submission_status === "approved"
                      ? "bg-gradient-to-r from-emerald-500/50 via-emerald-400 to-emerald-500/50"
                      : bounty.submission_status === "rejected"
                      ? "bg-gradient-to-r from-red-500/50 via-red-400 to-red-500/50"
                      : bounty.submission_status === "pending"
                      ? "bg-gradient-to-r from-amber-500/50 via-amber-400 to-amber-500/50"
                      : "bg-gradient-to-r from-transparent via-[#ef233c]/30 to-transparent"
                  }`}
                />

                <div className="p-5">
                  {/* Row 1: Status badges + Reward */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge status={bounty.status} />
                      <SubmissionStatusChip status={bounty.submission_status} />
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className="text-lg font-bold gradient-text font-[var(--font-heading)]">
                        {formatAlgo(bounty.reward_algo)}
                      </span>
                      <span className="text-xs text-zinc-500 ml-1">ALGO</span>
                    </div>
                  </div>

                  {/* Row 2: Title + Creator */}
                  <Link href={`/bounties/${bounty.id}`}>
                    <h3 className="text-sm font-semibold hover:text-[#ef233c] transition-colors line-clamp-1 cursor-pointer mb-0.5">
                      {bounty.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-zinc-600 mb-3">
                    by{" "}
                    <span className="text-zinc-400">
                      {bounty.creator_username}
                    </span>
                  </p>

                  {/* Row 3: Description */}
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
                    {bounty.description}
                  </p>

                  {/* Rejection Feedback */}
                  {bounty.rejection_feedback &&
                    bounty.submission_status === "rejected" && (
                      <div className="glass rounded-xl p-4 mb-4 border-l-2 border-red-500/40">
                        <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5 mb-2">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejection Feedback
                        </p>
                        <div className="bg-black/30 rounded-lg p-3 mb-2">
                          <p className="text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                            {bounty.rejection_feedback}
                          </p>
                        </div>
                        <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Address all points before resubmitting
                        </p>
                      </div>
                    )}

                  {/* Row 4: Deadline + Submission Progress */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <DeadlineTimer deadline={bounty.deadline} />
                    <div className="flex-1 min-w-[160px]">
                      <SubmissionProgress
                        count={bounty.submission_count || 0}
                        max={bounty.max_submissions}
                        remaining={bounty.submissions_remaining}
                      />
                    </div>
                  </div>

                  {/* Row 5: Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.06]">
                    {/* Submit Work */}
                    {bounty.can_submit && (
                      <Link href={`/bounties/${bounty.id}/submit`}>
                        <Button variant="primary" size="sm">
                          <Upload className="w-3.5 h-3.5" />
                          {bounty.can_resubmit
                            ? "Resubmit Work"
                            : "Submit Work"}
                        </Button>
                      </Link>
                    )}

                    {/* Pending indicator */}
                    {bounty.submission_status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs text-amber-400 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Awaiting Review
                      </span>
                    )}

                    {/* Approved indicator */}
                    {bounty.submission_status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass text-xs text-emerald-400 font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Approved 🎉
                      </span>
                    )}

                    {/* Let Go */}
                    {bounty.can_let_go && (
                      <>
                        {letGoConfirm === bounty.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-400">
                              ⚠️ Forfeits claim — creator gets refund
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleLetGo(bounty.id)}
                              disabled={actionLoading === bounty.id}
                            >
                              {actionLoading === bounty.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                "Confirm"
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLetGoConfirm(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setLetGoConfirm(bounty.id)}
                          >
                            <HandCoins className="w-3.5 h-3.5" />
                            Let Go
                          </Button>
                        )}
                      </>
                    )}

                    {/* Raise Dispute */}
                    {bounty.can_dispute && (
                      <Link href={`/bounties/${bounty.id}`}>
                        <Button variant="secondary" size="sm">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Dispute
                        </Button>
                      </Link>
                    )}

                    {/* View — always last */}
                    <div className="ml-auto">
                      <Link href={`/bounties/${bounty.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
