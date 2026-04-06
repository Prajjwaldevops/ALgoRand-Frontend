"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { daoApi, type DAOVote } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  Scale,
  Clock,
  CheckCircle,
  Users,
  ArrowLeft,
  Shield,
  Timer,
  ThumbsUp,
  ThumbsDown,
  User,
  ExternalLink,
  Gavel,
} from "lucide-react";
import Link from "next/link";

interface DisputeDetail {
  id: string;
  dispute_id: string;
  bounty_id: string;
  description: string;
  status: string;
  voting_deadline: string;
  created_at: string;
  freelancer_name: string;
  creator_name: string;
  bounty: { title: string; reward_algo: number; deadline: string };
  votes: { creator: number; freelancer: number; total: number };
  voting_active: boolean;
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [votes, setVotes] = useState<DAOVote[]>([]);
  const [tally, setTally] = useState<{ creator: number; freelancer: number; total: number }>({ creator: 0, freelancer: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteChoice, setVoteChoice] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Load dispute from list (we need to find it)
      const disputesRes = await daoApi.listActive();
      if (disputesRes.data) {
        const found = disputesRes.data.find((d) => d.id === disputeId);
        if (found) {
          setDispute(found as unknown as DisputeDetail);
        }
      }

      // Load votes
      const votesRes = await daoApi.getDisputeVotes(disputeId);
      if (votesRes.data) {
        setVotes(votesRes.data.votes || []);
        setTally(votesRes.data.tally);
      }
    } catch (e) {
      console.error("Failed to load dispute:", e);
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVote = async (vote: "creator" | "freelancer") => {
    setVoting(true);
    try {
      // In production, this would go through Pera Wallet signing
      const res = await daoApi.castVote(disputeId, vote, ["placeholder-signed-txn"]);
      if (res.success) {
        setVoted(true);
        setVoteChoice(vote);
        loadData(); // Refresh vote tally
      }
    } catch (e) {
      console.error("Vote failed:", e);
    } finally {
      setVoting(false);
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Voting ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
    return `${hours}h ${mins}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-vault-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto text-vault-text-muted mb-4" />
          <h1 className="text-2xl font-heading font-bold text-vault-text mb-2">Dispute Not Found</h1>
          <p className="text-vault-text-secondary mb-6">This dispute may have been resolved or doesn&apos;t exist.</p>
          <Link href="/dao" className="inline-flex items-center gap-2 text-vault-purple hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to DAO Court
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = tally.total;
  const creatorPct = totalVotes > 0 ? (tally.creator / totalVotes) * 100 : 50;
  const freelancerPct = totalVotes > 0 ? (tally.freelancer / totalVotes) * 100 : 50;
  const votingOpen = dispute.voting_active && new Date(dispute.voting_deadline) > new Date();

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link href="/dao" className="inline-flex items-center gap-2 text-vault-text-secondary hover:text-vault-purple transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to DAO Court</span>
        </Link>

        {/* Dispute Header */}
        <ScrollReveal>
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-vault-purple font-bold">{dispute.dispute_id}</span>
                  {votingOpen ? (
                    <span className="px-2 py-0.5 rounded-full bg-vault-green/15 text-vault-green text-xs font-medium animate-pulse">
                      🔴 Live Voting
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-vault-text-muted/15 text-vault-text-muted text-xs font-medium">
                      {dispute.status}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-heading font-bold text-vault-text">{dispute.bounty.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold text-vault-green">{dispute.bounty.reward_algo.toFixed(2)} Ⱥ</p>
                <p className="text-xs text-vault-text-muted">at stake</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm">
              <Timer className={`w-4 h-4 ${votingOpen ? "text-vault-amber" : "text-vault-text-muted"}`} />
              <span className={votingOpen ? "text-vault-amber font-medium" : "text-vault-text-muted"}>
                {getTimeRemaining(dispute.voting_deadline)}
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Parties */}
        <ScrollReveal delay={50}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass-card rounded-xl p-5 border-vault-cyan/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-vault-cyan/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-vault-cyan" />
                </div>
                <span className="text-xs text-vault-text-muted uppercase tracking-wider">Creator</span>
              </div>
              <p className="font-semibold text-vault-text">{dispute.creator_name}</p>
            </div>
            <div className="glass-card rounded-xl p-5 border-vault-purple/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-vault-purple/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-vault-purple" />
                </div>
                <span className="text-xs text-vault-text-muted uppercase tracking-wider">Freelancer</span>
              </div>
              <p className="font-semibold text-vault-text">{dispute.freelancer_name}</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Vote Progress */}
        <ScrollReveal delay={100}>
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-heading font-semibold text-vault-text mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-vault-purple" />
              Vote Tally
            </h2>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-vault-cyan font-medium">
                  Creator: {tally.creator} ({creatorPct.toFixed(0)}%)
                </span>
                <span className="text-vault-purple font-medium">
                  Freelancer: {tally.freelancer} ({freelancerPct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-4 bg-vault-bg rounded-full overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-vault-cyan to-vault-cyan/60 transition-all duration-700 rounded-l-full"
                  style={{ width: `${creatorPct}%` }}
                />
                <div
                  className="bg-gradient-to-r from-vault-purple/60 to-vault-purple transition-all duration-700 rounded-r-full"
                  style={{ width: `${freelancerPct}%` }}
                />
              </div>
              <p className="text-center text-xs text-vault-text-muted mt-2">
                {totalVotes} total vote{totalVotes !== 1 ? "s" : ""} cast
              </p>
            </div>

            {/* Vote Buttons */}
            {votingOpen && !voted && user && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => handleVote("creator")}
                  disabled={voting}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-vault-cyan/10 border border-vault-cyan/30 text-vault-cyan font-medium hover:bg-vault-cyan/20 hover:border-vault-cyan/50 transition-all duration-300 disabled:opacity-50"
                >
                  <ThumbsUp className="w-5 h-5" />
                  Side with Creator
                </button>
                <button
                  onClick={() => handleVote("freelancer")}
                  disabled={voting}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-vault-purple/10 border border-vault-purple/30 text-vault-purple font-medium hover:bg-vault-purple/20 hover:border-vault-purple/50 transition-all duration-300 disabled:opacity-50"
                >
                  <ThumbsDown className="w-5 h-5" />
                  Side with Freelancer
                </button>
              </div>
            )}

            {voted && (
              <div className="mt-4 p-4 rounded-xl bg-vault-green/10 border border-vault-green/20 text-center">
                <CheckCircle className="w-6 h-6 text-vault-green mx-auto mb-2" />
                <p className="text-vault-green font-medium">
                  Your vote for <span className="font-bold">{voteChoice}</span> has been recorded on-chain!
                </p>
              </div>
            )}

            {!votingOpen && (
              <div className="mt-4 p-4 rounded-xl bg-vault-text-muted/5 border border-vault-border text-center">
                <Gavel className="w-6 h-6 text-vault-text-muted mx-auto mb-2" />
                <p className="text-vault-text-muted text-sm">
                  Voting period has ended. This dispute can now be finalized.
                </p>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Vote History */}
        <ScrollReveal delay={150}>
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-heading font-semibold text-vault-text mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-vault-cyan" />
              Vote History ({votes.length})
            </h2>

            {votes.length === 0 ? (
              <p className="text-vault-text-muted text-center py-8">
                No votes have been cast yet. Be the first to vote!
              </p>
            ) : (
              <div className="space-y-3">
                {votes.map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between p-3 rounded-xl bg-vault-bg/50 border border-vault-border/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        vote.vote === "creator" ? "bg-vault-cyan/10" : "bg-vault-purple/10"
                      }`}>
                        {vote.vote === "creator" ? (
                          <ThumbsUp className="w-4 h-4 text-vault-cyan" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-vault-purple" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-vault-text">
                          {vote.voter.display_name || vote.voter.username}
                        </p>
                        <p className="text-xs text-vault-text-muted">
                          Voted {vote.vote} • {new Date(vote.voted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {vote.vote_txn_id && (
                      <a
                        href={`https://testnet.algoexplorer.io/tx/${vote.vote_txn_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-vault-purple hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Txn
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
