"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { daoApi, type Dispute } from "@/lib/api";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { AIChatbot } from "@/components/AIChatbot";
import {
  Scale,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
  Shield,
  Timer,
  Flame,
} from "lucide-react";

export default function DAOCourtPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const loadDisputes = useCallback(async () => {
    try {
      const res = await daoApi.listActive();
      if (res.data) setDisputes(res.data);
    } catch (e) {
      console.error("Failed to load disputes:", e);
    } finally {
      // Only set loading false on initial load — silent refresh afterwards
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDisputes();

    // Live updates — poll every 5 seconds (silent, no loading flash)
    const interval = setInterval(() => {
      loadDisputes();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadDisputes]);

  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Voting ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <ScrollReveal>
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/20 mb-6">
              <Scale className="w-4 h-4 text-[#ef233c]" />
              <span className="text-sm text-[#ef233c] font-medium">Decentralized Dispute Resolution</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-[var(--font-heading)] font-bold mb-4">
              <span className="text-[#ef233c]">
                DAO Court
              </span>
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
              When freelancers and creators disagree, the community decides.
              Vote on active disputes to help resolve bounty conflicts fairly.
            </p>
            <div className="mt-4 flex justify-center">
              <Link
                href="/dao/history"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-all"
              >
                <Clock className="w-4 h-4" />
                View Voting History
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats bar — responsive */}
        <ScrollReveal delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-[var(--font-heading)] font-bold text-[#ef233c]">{disputes.length}</p>
              <p className="text-xs text-zinc-500 mt-1">Active Disputes</p>
            </div>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-[var(--font-heading)] font-bold text-white">
                {disputes.reduce((a, d) => a + d.votes.total, 0)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Total Votes Cast</p>
            </div>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-[var(--font-heading)] font-bold text-emerald-400">
                {disputes.reduce((a, d) => a + d.bounty.reward_algo, 0).toFixed(1)} Ⱥ
              </p>
              <p className="text-xs text-zinc-500 mt-1">ALGO at Stake</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Disputes list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#ef233c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : disputes.length === 0 ? (
          <ScrollReveal>
            <div className="text-center py-20">
              <Shield className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
              <h2 className="text-xl font-[var(--font-heading)] font-semibold text-white mb-2">
                No Active Disputes
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                The DAO Court is currently at peace. When a freelancer raises a dispute,
                it will appear here for community voting.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {disputes.map((dispute, i) => {
              const totalVotes = dispute.votes.total;
              const creatorPct = totalVotes > 0 ? (dispute.votes.creator / totalVotes) * 100 : 50;
              const freelancerPct = totalVotes > 0 ? (dispute.votes.freelancer / totalVotes) * 100 : 50;

              return (
                <ScrollReveal key={dispute.id} delay={i * 100}>
                  <div className="border border-white/10 bg-black rounded-xl p-4 sm:p-6 hover:border-[#ef233c]/30 transition-all duration-500 group">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 sm:mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-[#ef233c] font-medium">
                            {dispute.dispute_id}
                          </span>
                          {dispute.voting_active && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium animate-pulse">
                              <Flame className="w-3 h-3" />
                              Live
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-[var(--font-heading)] font-semibold text-white">
                          {dispute.bounty.title}
                        </h3>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="text-xl font-mono font-bold text-emerald-400">
                          {dispute.bounty.reward_algo.toFixed(2)} Ⱥ
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">at stake</p>
                      </div>
                    </div>

                    {/* Parties — responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                        <p className="text-xs text-zinc-500 mb-1">Creator</p>
                        <p className="text-sm font-medium text-white">{dispute.creator_name}</p>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                        <p className="text-xs text-zinc-500 mb-1">Freelancer</p>
                        <p className="text-sm font-medium text-white">{dispute.freelancer_name}</p>
                      </div>
                    </div>

                    {/* Vote Progress */}
                    <div className="mb-4 sm:mb-5">
                      <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                        <span>Creator: {dispute.votes.creator} ({creatorPct.toFixed(0)}%)</span>
                        <span>Freelancer: {dispute.votes.freelancer} ({freelancerPct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-3 bg-zinc-900 rounded-full overflow-hidden flex">
                        <div
                          className="bg-gradient-to-r from-[#ef233c] to-[#ef233c]/70 transition-all duration-500 rounded-l-full"
                          style={{ width: `${creatorPct}%` }}
                        />
                        <div
                          className="bg-gradient-to-r from-white/20 to-white/10 transition-all duration-500 rounded-r-full"
                          style={{ width: `${freelancerPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-center mt-2">
                        <span className="text-xs text-zinc-500">
                          <Users className="w-3 h-3 inline mr-1" />
                          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Footer — responsive */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="w-4 h-4 text-amber-400" />
                        <span className={`font-medium ${
                          dispute.voting_active ? "text-amber-400" : "text-zinc-500"
                        }`}>
                          {getTimeRemaining(dispute.voting_deadline)}
                        </span>
                      </div>
                      <Link
                        href={`/dao/${dispute.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef233c]/10 text-[#ef233c] text-sm font-medium hover:bg-[#ef233c]/20 transition-colors w-full sm:w-auto justify-center"
                      >
                        {dispute.voting_active ? "Vote Now" : "View Details"}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        {/* How it Works */}
        <ScrollReveal delay={200}>
          <div className="mt-12 sm:mt-16 border border-white/10 bg-zinc-900/50 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-[var(--font-heading)] font-bold text-white mb-6 text-center">
              How DAO Court Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-[#ef233c]" />
                </div>
                <h3 className="font-semibold text-white mb-1">1. Dispute Raised</h3>
                <p className="text-sm text-zinc-400">
                  Freelancer writes a 300+ word description with full submission history
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-[#ef233c]" />
                </div>
                <h3 className="font-semibold text-white mb-1">2. Community Votes</h3>
                <p className="text-sm text-zinc-400">
                  48-hour voting window. Uninvolved community members cast on-chain votes
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">3. Resolution</h3>
                <p className="text-sm text-zinc-400">
                  After deadline, anyone can finalize. Ties favor the creator. ALGO released to winner
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* AI Chatbot */}
      <AIChatbot disputes={disputes as unknown as Record<string, unknown>[]} />
    </div>
  );
}
