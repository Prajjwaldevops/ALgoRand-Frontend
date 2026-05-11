"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { dashboardApi, type DashboardDispute } from "@/lib/api";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ShieldAlert, Clock, ThumbsUp, ThumbsDown, Users, ExternalLink } from "lucide-react";

export default function CreatorDisputesPage() {
  const [disputes, setDisputes] = useState<DashboardDispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.disputes();
      if (res.success && res.data) setDisputes(res.data);
    } catch { /* defaults */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  const statusColorMap: Record<string, string> = {
    open: "text-amber-400 bg-amber-500/10",
    resolved_creator: "text-emerald-400 bg-emerald-500/10",
    resolved_freelancer: "text-[#ef233c] bg-[#ef233c]/10",
    escalated: "text-red-400 bg-red-500/10",
    auto_refunded: "text-zinc-500 bg-white/5",
    dao_resolved: "text-[#ef233c] bg-[#ef233c]/10",
  };

  return (
    <div className="space-y-6 py-4">
      <ScrollReveal>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-400" /> Disputes
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Track and manage disputes on your bounties
        </p>
      </ScrollReveal>

      {disputes.length === 0 ? (
        <ScrollReveal delay={0.1}>
          <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-10 text-center rounded-2xl">
            <ShieldAlert className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No disputes</h3>
            <p className="text-sm text-zinc-400">
              Great news! No disputes have been filed on your bounties.
            </p>
          </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal delay={0.1}>
          <div className="space-y-4">
            {disputes.map((dispute, i) => (
              <div
                key={dispute.id}
                className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-5 rounded-2xl"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-medium ${statusColorMap[dispute.status] || "text-zinc-500 bg-white/5"}`}>
                        {dispute.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-zinc-500">
                        by {dispute.initiated_by_username}
                      </span>
                    </div>
                    <Link
                      href={`/bounties/${dispute.bounty_id}`}
                      className="text-sm font-semibold hover:text-[#ef233c] transition-colors flex items-center gap-1"
                    >
                      {dispute.bounty_title}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {dispute.reason}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold gradient-text">{dispute.bounty_reward} ALGO</div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(dispute.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Vote tally */}
                <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500">DAO Votes:</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">{dispute.votes.approve}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-medium text-red-400">{dispute.votes.reject}</span>
                  </div>
                  <span className="text-xs text-zinc-500">/ {dispute.votes.total} total</span>
                  {dispute.dao_vote_deadline && (
                    <span className="text-[10px] text-amber-400 ml-auto">
                      Vote ends: {new Date(dispute.dao_vote_deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
