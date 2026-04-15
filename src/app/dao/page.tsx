"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { daoApi, type Dispute } from "@/lib/api";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
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

  const loadDisputes = useCallback(async () => {
    try {
      const res = await daoApi.listActive();
      if (res.data) setDisputes(res.data);
    } catch (e) {
      console.error("Failed to load disputes:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisputes();

    // Live updates — poll every 5 seconds
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vault-purple/10 border border-vault-purple/20 mb-6">
              <Scale className="w-4 h-4 text-vault-purple" />
              <span className="text-sm text-vault-purple font-medium">Decentralized Dispute Resolution</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold mb-4">
              <span className="bg-gradient-to-r from-vault-purple via-vault-cyan to-vault-purple bg-clip-text text-transparent">
                DAO Court
              </span>
            </h1>
            <p className="text-lg text-vault-text-secondary max-w-2xl mx-auto">
              When freelancers and creators disagree, the community decides. 
              Vote on active disputes to help resolve bounty conflicts fairly.
            </p>
          </div>
        </ScrollReveal>

        {/* Stats bar */}
        <ScrollReveal delay={100}>
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-heading font-bold text-vault-purple">{disputes.length}</p>
              <p className="text-xs text-vault-text-muted mt-1">Active Disputes</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-heading font-bold text-vault-cyan">
                {disputes.reduce((a, d) => a + d.votes.total, 0)}
              </p>
              <p className="text-xs text-vault-text-muted mt-1">Total Votes Cast</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-heading font-bold text-vault-green">
                {disputes.reduce((a, d) => a + d.bounty.reward_algo, 0).toFixed(1)} Ⱥ
              </p>
              <p className="text-xs text-vault-text-muted mt-1">ALGO at Stake</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Disputes list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-vault-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : disputes.length === 0 ? (
          <ScrollReveal>
            <div className="text-center py-20">
              <Shield className="w-16 h-16 mx-auto text-vault-text-muted mb-4 opacity-40" />
              <h2 className="text-xl font-heading font-semibold text-vault-text mb-2">
                No Active Disputes
              </h2>
              <p className="text-vault-text-secondary max-w-md mx-auto">
                The DAO Court is currently at peace. When a freelancer raises a dispute,
                it will appear here for community voting.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="space-y-6">
            {disputes.map((dispute, i) => {
              const totalVotes = dispute.votes.total;
              const creatorPct = totalVotes > 0 ? (dispute.votes.creator / totalVotes) * 100 : 50;
              const freelancerPct = totalVotes > 0 ? (dispute.votes.freelancer / totalVotes) * 100 : 50;

              return (
                <ScrollReveal key={dispute.id} delay={i * 100}>
                  <div className="glass-card rounded-2xl p-6 hover:border-vault-purple/30 transition-all duration-500 group">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-sm text-vault-purple font-medium">
                            {dispute.dispute_id}
                          </span>
                          {dispute.voting_active && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vault-green/15 text-vault-green text-xs font-medium animate-pulse">
                              <Flame className="w-3 h-3" />
                              Live
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-heading font-semibold text-vault-text">
                          {dispute.bounty.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-mono font-bold text-vault-green">
                          {dispute.bounty.reward_algo.toFixed(2)} Ⱥ
                        </p>
                        <p className="text-xs text-vault-text-muted mt-1">at stake</p>
                      </div>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="bg-vault-cyan/5 border border-vault-cyan/10 rounded-xl p-3">
                        <p className="text-xs text-vault-text-muted mb-1">Creator</p>
                        <p className="text-sm font-medium text-vault-text">{dispute.creator_name}</p>
                      </div>
                      <div className="bg-vault-purple/5 border border-vault-purple/10 rounded-xl p-3">
                        <p className="text-xs text-vault-text-muted mb-1">Freelancer</p>
                        <p className="text-sm font-medium text-vault-text">{dispute.freelancer_name}</p>
                      </div>
                    </div>

                    {/* Vote Progress */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between text-xs text-vault-text-muted mb-2">
                        <span>Creator: {dispute.votes.creator} votes ({creatorPct.toFixed(0)}%)</span>
                        <span>Freelancer: {dispute.votes.freelancer} votes ({freelancerPct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-3 bg-vault-bg rounded-full overflow-hidden flex">
                        <div
                          className="bg-gradient-to-r from-vault-cyan to-vault-cyan/70 transition-all duration-500 rounded-l-full"
                          style={{ width: `${creatorPct}%` }}
                        />
                        <div
                          className="bg-gradient-to-r from-vault-purple/70 to-vault-purple transition-all duration-500 rounded-r-full"
                          style={{ width: `${freelancerPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-center mt-2">
                        <span className="text-xs text-vault-text-muted">
                          <Users className="w-3 h-3 inline mr-1" />
                          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="w-4 h-4 text-vault-amber" />
                        <span className={`font-medium ${
                          dispute.voting_active ? "text-vault-amber" : "text-vault-text-muted"
                        }`}>
                          {getTimeRemaining(dispute.voting_deadline)}
                        </span>
                      </div>
                      <Link
                        href={`/dao/${dispute.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vault-purple/10 text-vault-purple text-sm font-medium hover:bg-vault-purple/20 transition-colors group-hover:translate-x-1 duration-300"
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
          <div className="mt-16 glass-card rounded-2xl p-8">
            <h2 className="text-xl font-heading font-bold text-vault-text mb-6 text-center">
              How DAO Court Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-vault-purple/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-vault-purple" />
                </div>
                <h3 className="font-semibold text-vault-text mb-1">1. Dispute Raised</h3>
                <p className="text-sm text-vault-text-secondary">
                  Freelancer writes a 300+ word description with full submission history
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-vault-cyan/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-vault-cyan" />
                </div>
                <h3 className="font-semibold text-vault-text mb-1">2. Community Votes</h3>
                <p className="text-sm text-vault-text-secondary">
                  48-hour voting window. Uninvolved community members cast on-chain votes
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-vault-green/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-vault-green" />
                </div>
                <h3 className="font-semibold text-vault-text mb-1">3. Resolution</h3>
                <p className="text-sm text-vault-text-secondary">
                  After deadline, anyone can finalize. Ties favor the creator. ALGO released to winner
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
