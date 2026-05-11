"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { dashboardApi, type DashboardDispute } from "@/lib/api";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo } from "@/lib/utils";
import {
  Shield,
  Scale,
  Clock,
  Users,
  Timer,
  ArrowRight,
  Flame,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export default function FreelancerDisputesPage() {
  const [disputes, setDisputes] = useState<DashboardDispute[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await dashboardApi.disputes();
      if (res.success && res.data) setDisputes(res.data);
    } catch (e) {
      console.error("Failed to load disputes:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTimeRemaining = (deadline?: string) => {
    if (!deadline) return "N/A";
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Voting ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
    return `${hours}h ${mins}m left`;
  };

  const statusConfig: Record<
    string,
    { color: string; bg: string; icon: React.ComponentType<{ className?: string }>; label: string }
  > = {
    open: { color: "text-amber-400", bg: "bg-amber-500/10", icon: Scale, label: "DAO Voting Active" },
    resolved_creator: { color: "text-[#ef233c]", bg: "bg-[#ef233c]/10", icon: CheckCircle, label: "Creator Won" },
    resolved_freelancer: { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle, label: "You Won!" },
    tie_resolved: { color: "text-zinc-500", bg: "bg-white/5", icon: XCircle, label: "Tie — Creator Wins" },
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-heading)] flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-400" /> My Disputes
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Disputes you&apos;ve raised — track DAO Court voting and outcomes
            </p>
          </div>
          <Link
            href="/dao"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef233c]/10 text-[#ef233c] text-sm font-medium hover:bg-[#ef233c]/20 transition-colors"
          >
            <Scale className="w-4 h-4" /> DAO Court
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </ScrollReveal>

      {/* Stats Bar */}
      {disputes.length > 0 && (
        <ScrollReveal delay={0.05}>
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-[var(--font-heading)] font-bold text-amber-400">
                {disputes.filter((d) => d.status === "open").length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Active Votes</p>
            </div>
            <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-[var(--font-heading)] font-bold text-emerald-400">
                {disputes.filter((d) => d.status === "resolved_freelancer").length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Won</p>
            </div>
            <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-2xl font-[var(--font-heading)] font-bold text-zinc-500">
                {disputes.length}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Total</p>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <ScrollReveal delay={0.1}>
          <div className="text-center py-16">
            <Shield className="w-16 h-16 mx-auto text-zinc-500 mb-4 opacity-40" />
            <h2 className="text-xl font-[var(--font-heading)] font-semibold text-white mb-2">
              No Disputes Raised
            </h2>
            <p className="text-zinc-400 max-w-md mx-auto">
              If a creator rejects all your submissions unfairly, you can raise a dispute
              to have the DAO community vote on the outcome.
            </p>
          </div>
        </ScrollReveal>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute, i) => {
            const cfg = statusConfig[dispute.status] || statusConfig.open;
            const StatusIcon = cfg.icon;
            const totalVotes = dispute.votes
              ? (dispute.votes.approve || 0) + (dispute.votes.reject || 0) + (dispute.votes.total || 0)
              : 0;

            return (
              <ScrollReveal key={dispute.id} delay={i * 80}>
                <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 hover:border-[#ef233c]/30 transition-all duration-500 group">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-[var(--font-heading)] font-semibold text-white">
                        {dispute.bounty_title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        {dispute.status === "open" && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                            <Flame className="w-3 h-3 animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-mono font-bold text-emerald-400">
                        {formatAlgo(dispute.bounty_reward)} Ⱥ
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">at stake</p>
                    </div>
                  </div>

                  {/* Reason preview */}
                  {dispute.reason && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">
                        Your Dispute Description
                      </p>
                      <p className="text-sm text-zinc-400 line-clamp-2">
                        {dispute.reason}
                      </p>
                    </div>
                  )}

                  {/* Vote Progress (if voting) */}
                  {dispute.status === "open" && dispute.votes && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                        <span>Creator: {dispute.votes.approve || 0} votes</span>
                        <span>Freelancer (You): {dispute.votes.reject || 0} votes</span>
                      </div>
                      <div className="h-2.5 bg-black rounded-full overflow-hidden flex">
                        <div
                          className="bg-vault-cyan transition-all duration-500 rounded-l-full"
                          style={{
                            width: `${totalVotes > 0
                                ? ((dispute.votes.approve || 0) / totalVotes) * 100
                                : 50
                              }%`,
                          }}
                        />
                        <div
                          className="bg-[#ef233c] transition-all duration-500 rounded-r-full"
                          style={{
                            width: `${totalVotes > 0
                                ? ((dispute.votes.reject || 0) / totalVotes) * 100
                                : 50
                              }%`,
                          }}
                        />
                      </div>
                      <p className="text-center text-[11px] text-zinc-500 mt-1.5">
                        <Users className="w-3 h-3 inline mr-1" />
                        {totalVotes} vote{totalVotes !== 1 ? "s" : ""} cast
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="w-4 h-4 text-amber-400" />
                      <span
                        className={
                          dispute.status === "open"
                            ? "text-amber-400 font-medium"
                            : "text-zinc-500"
                        }
                      >
                        {dispute.dao_vote_deadline
                          ? getTimeRemaining(dispute.dao_vote_deadline)
                          : "No deadline set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/bounties/${dispute.bounty_id}`}
                        className="text-xs text-zinc-500 hover:text-white transition-colors"
                      >
                        View Bounty
                      </Link>
                      <Link
                        href={`/dao/${dispute.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ef233c]/10 text-[#ef233c] text-xs font-medium hover:bg-[#ef233c]/20 transition-colors"
                      >
                        {dispute.status === "open" ? "View Votes" : "View Details"}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <ScrollReveal delay={0.2}>
        <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm rounded-xl p-5 border-[#ef233c]/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ef233c]/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#ef233c]" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">How Disputes Work</h4>
              <p className="text-sm text-zinc-400">
                After all submission attempts are exhausted, you can raise a dispute by writing a
                300+ word description. The DAO community then votes within 48 hours. If freelancer
                votes exceed creator votes, you receive the ALGO reward. Ties favor the creator.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
