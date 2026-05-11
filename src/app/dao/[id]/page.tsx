"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { daoApi, type DAOVote, type DisputeDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  Scale, CheckCircle, Users, ArrowLeft, Shield, Timer,
  ThumbsUp, ThumbsDown, User, ExternalLink, Gavel, Hash,
  FileText, MessageSquare, XCircle, Copy, Clock,
  AlertTriangle, Wallet, Ban, Zap,
} from "lucide-react";
import Link from "next/link";

export default function DisputeDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const { accountAddress, isConnected, connectWallet, signTransactionGroup } = useWallet();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [votes, setVotes] = useState<DAOVote[]>([]);
  const [tally, setTally] = useState<{ creator: number; freelancer: number; total: number }>({ creator: 0, freelancer: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteChoice, setVoteChoice] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [votingStatus, setVotingStatus] = useState<{
    is_compliant: boolean;
    is_banned: boolean;
    days_remaining: number;
    last_vote_at: string | null;
  } | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  // Track if initial load is done to avoid resetting loading on polls
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const detailRes = await daoApi.getDisputeDetail(disputeId);
      if (detailRes.success && detailRes.data) {
        setDispute(detailRes.data);
        setTally(detailRes.data.votes);
      }

      const votesRes = await daoApi.getDisputeVotes(disputeId);
      if (votesRes.data) {
        setVotes(votesRes.data.votes || []);
        if (votesRes.data.tally) setTally(votesRes.data.tally);

        if (user && votesRes.data.votes) {
          const myVote = votesRes.data.votes.find(
            (v: DAOVote) => v.voter_id === user.id
          );
          if (myVote) {
            setVoted(true);
            setVoteChoice(myVote.vote);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load dispute:", e);
    } finally {
      if (!initialLoadDone.current) {
        setLoading(false);
        initialLoadDone.current = true;
      }
    }
  }, [disputeId, user]);

  const loadVotingStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await daoApi.getVotingStatus();
      if (res.success && res.data) {
        setVotingStatus(res.data);
      }
    } catch (e) {
      console.error("Failed to load voting status:", e);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    loadVotingStatus();
    const interval = setInterval(() => { loadData(); }, 5000);
    return () => clearInterval(interval);
  }, [loadData, loadVotingStatus]);

  const handleVote = async (vote: "creator" | "freelancer") => {
    setVoting(true);
    setVoteError(null);

    try {
      if (!isConnected || !accountAddress) {
        await connectWallet();
        if (!accountAddress) {
          setVoteError("Please connect your Pera Wallet first to cast a vote.");
          setVoting(false);
          return;
        }
      }

      const walletAddr = accountAddress;
      if (!walletAddr) {
        setVoteError("Wallet not connected. Please connect your Pera Wallet.");
        setVoting(false);
        return;
      }

      const buildRes = await daoApi.buildVoteTxn(disputeId, walletAddr, vote);
      if (!buildRes.success || !buildRes.data) {
        setVoteError(buildRes.error || "Failed to build vote transaction");
        setVoting(false);
        return;
      }

      const signedTxns = await signTransactionGroup(buildRes.data.transactions);

      const res = await daoApi.castVote(disputeId, vote, signedTxns);
      if (res.success) {
        setVoted(true);
        setVoteChoice(vote);
        if (res.data) {
          const data = res.data as { votes_creator: number; votes_freelancer: number };
          setTally({
            creator: data.votes_creator,
            freelancer: data.votes_freelancer,
            total: data.votes_creator + data.votes_freelancer,
          });
        }
        loadData();
        loadVotingStatus();
      } else {
        setVoteError(res.error || "Vote failed");
      }
    } catch (e: unknown) {
      const error = e as { data?: { type?: string }; message?: string };
      if (
        error?.data?.type === "CONNECT_MODAL_CLOSED" ||
        (error?.message && /close|cancel|reject/i.test(error.message))
      ) {
        setVoting(false);
        return;
      }
      console.error("Vote failed:", e);
      setVoteError("Transaction failed. Please try again.");
    } finally {
      setVoting(false);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setVoteError(null);
    try {
      if (!isConnected || !accountAddress) {
        await connectWallet();
        if (!accountAddress) {
          setVoteError("Please connect your Pera Wallet to finalize.");
          setFinalizing(false);
          return;
        }
      }

      const walletAddr = accountAddress;
      if (!walletAddr) {
        setVoteError("Wallet not connected.");
        setFinalizing(false);
        return;
      }

      const buildRes = await daoApi.buildFinalizeTxn(disputeId, walletAddr);
      if (!buildRes.success || !buildRes.data) {
        const res = await daoApi.finalize(disputeId);
        if (res.success) { loadData(); } else { setVoteError(res.error || "Finalization failed"); }
        setFinalizing(false);
        return;
      }

      const signedTxns = await signTransactionGroup(buildRes.data.transactions);
      const res = await daoApi.finalize(disputeId, signedTxns);
      if (res.success) {
        loadData();
      } else {
        setVoteError(res.error || "Finalization failed");
      }
    } catch (e: unknown) {
      const error = e as { data?: { type?: string }; message?: string };
      if (
        error?.data?.type === "CONNECT_MODAL_CLOSED" ||
        (error?.message && /close|cancel|reject/i.test(error.message))
      ) {
        setFinalizing(false);
        return;
      }
      console.error("Finalize failed:", e);
      try {
        const res = await daoApi.finalize(disputeId);
        if (res.success) { loadData(); } else { setVoteError(res.error || "Finalization failed"); }
      } catch { setVoteError("Finalization failed. Please try again."); }
    } finally {
      setFinalizing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
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
        <div className="w-10 h-10 border-2 border-[#ef233c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
          <h1 className="text-2xl font-[var(--font-heading)] font-bold text-white mb-2">Dispute Not Found</h1>
          <p className="text-zinc-400 mb-6">This dispute may have been resolved or doesn&apos;t exist.</p>
          <Link href="/dao" className="inline-flex items-center gap-2 text-[#ef233c] hover:underline">
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
  const votingExpired = new Date(dispute.voting_deadline) <= new Date() && dispute.status === "open";
  const isParty = user && (user.id === dispute.freelancer_id || user.id === dispute.creator_id);
  const isResolved = dispute.status !== "open";

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link href="/dao" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#ef233c] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to DAO Court</span>
        </Link>

        {/* Voting Compliance Banner */}
        {user && votingStatus && !votingStatus.is_compliant && (
          <ScrollReveal>
            <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-800/30">
              <div className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-semibold text-sm">⚠️ Monthly Voting Required</p>
                  <p className="text-zinc-400 text-xs mt-1">
                    You must vote at least once every 30 days to remain in good standing.
                    {votingStatus.is_banned
                      ? " You are currently banned from platform actions. Cast a vote below to lift the ban."
                      : " Vote on this or any active dispute to stay compliant."}
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Dispute Header */}
        <ScrollReveal>
          <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-[#ef233c] font-bold">{dispute.dispute_id}</span>
                  {votingOpen ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium animate-pulse">
                      🔴 Live Voting
                    </span>
                  ) : isResolved ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      dispute.status === "resolved_freelancer"
                        ? "bg-[#ef233c]/15 text-[#ef233c]"
                        : "bg-blue-500/15 text-blue-400"
                    }`}>
                      {dispute.status === "resolved_freelancer" ? "🏆 Freelancer Won" : "🏆 Creator Won"}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-500 text-xs font-medium">
                      {dispute.status}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-[var(--font-heading)] font-bold text-white">{dispute.bounty.title}</h1>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold text-emerald-400">{dispute.bounty.reward_algo.toFixed(2)} Ⱥ</p>
                <p className="text-xs text-zinc-500">at stake</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm">
              <Timer className={`w-4 h-4 ${votingOpen ? "text-amber-400" : "text-zinc-500"}`} />
              <span className={votingOpen ? "text-amber-400 font-medium" : "text-zinc-500"}>
                {getTimeRemaining(dispute.voting_deadline)}
              </span>
            </div>
          </div>
        </ScrollReveal>

        {/* Parties */}
        <ScrollReveal delay={0.05}>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Creator</span>
              </div>
              <p className="font-semibold text-white">{dispute.creator_name}</p>
            </div>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#ef233c]/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#ef233c]" />
                </div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Freelancer</span>
              </div>
              <p className="font-semibold text-white">{dispute.freelancer_name}</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Freelancer's Dispute Description */}
        <ScrollReveal delay={0.075}>
          <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-[var(--font-heading)] font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#ef233c]" />
              Freelancer&apos;s Dispute Statement
            </h2>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {dispute.freelancer_description}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Conversation History — Submissions & Rejections */}
        {dispute.conversation && dispute.conversation.length > 0 && (
          <ScrollReveal delay={0.1}>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-[var(--font-heading)] font-semibold text-white mb-5 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#ef233c]" />
                Submission &amp; Review History
              </h2>

              <div className="space-y-4">
                {dispute.conversation.map((entry, i) => (
                  <div key={i} className="relative">
                    {i < dispute.conversation.length - 1 && (
                      <div className="absolute left-5 top-12 bottom-0 w-px bg-white/5" />
                    )}

                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                      {/* Submission Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-[#ef233c]/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[#ef233c]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              Submission #{entry.submission_number}
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              <Clock className="w-3 h-3 inline mr-0.5" />
                              {new Date(entry.submitted_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          entry.status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                          entry.status === "rejected" ? "bg-red-500/15 text-red-400" :
                          "bg-amber-500/15 text-amber-400"
                        }`}>
                          {entry.status}
                        </span>
                      </div>

                      {/* Freelancer's Description */}
                      <div className="mb-3 pl-12">
                        <p className="text-xs text-zinc-500 mb-1 font-medium">Freelancer&apos;s Description:</p>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          {entry.description}
                        </p>
                      </div>

                      {/* Work Hash */}
                      {entry.work_hash && (
                        <div className="mb-3 pl-12">
                          <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3 text-[#ef233c] flex-shrink-0" />
                            <span className="text-[10px] text-zinc-500 font-medium">Work Hash:</span>
                            <code className="text-[10px] font-mono text-[#ef233c] bg-white/5 px-2 py-0.5 rounded flex-1 truncate">
                              {entry.work_hash}
                            </code>
                            <button
                              onClick={() => copyToClipboard(entry.work_hash)}
                              className="p-1 hover:bg-[#ef233c]/10 rounded transition-colors"
                              title="Copy hash"
                            >
                              {copiedHash === entry.work_hash ? (
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-zinc-500" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Creator's Rejection Feedback */}
                      {entry.rejection_feedback && entry.rejection_feedback.length > 0 && (
                        <div className="pl-12 mt-3 pt-3 border-t border-white/5">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-red-400 font-medium mb-1">Creator&apos;s Rejection Feedback:</p>
                              <p className="text-sm text-zinc-400 italic leading-relaxed">
                                &ldquo;{entry.rejection_feedback}&rdquo;
                              </p>
                              {entry.reviewed_at && (
                                <p className="text-[10px] text-zinc-500 mt-1">
                                  Reviewed: {new Date(entry.reviewed_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Vote Tally */}
        <ScrollReveal delay={0.125}>
          <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-[var(--font-heading)] font-semibold text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#ef233c]" />
              Vote Tally
              {votingOpen && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-medium animate-pulse">
                  <Zap className="w-3 h-3 inline mr-0.5" /> LIVE
                </span>
              )}
            </h2>

            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-blue-400 font-medium">
                  Creator: {tally.creator} ({creatorPct.toFixed(0)}%)
                </span>
                <span className="text-[#ef233c] font-medium">
                  Freelancer: {tally.freelancer} ({freelancerPct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-4 bg-black rounded-full overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-500/60 transition-all duration-700 ease-out rounded-l-full"
                  style={{ width: `${creatorPct}%` }}
                />
                <div
                  className="bg-gradient-to-r from-[#ef233c]/60 to-[#ef233c] transition-all duration-700 ease-out rounded-r-full"
                  style={{ width: `${freelancerPct}%` }}
                />
              </div>
              <p className="text-center text-xs text-zinc-500 mt-2">
                {totalVotes} total vote{totalVotes !== 1 ? "s" : ""} cast
              </p>
            </div>

            {/* Vote Error */}
            {voteError && (
              <div className="mt-4 p-3 rounded-xl bg-red-900/20 border border-red-800/30 text-center">
                <p className="text-red-400 text-sm">{voteError}</p>
              </div>
            )}

            {/* Vote Buttons */}
            {votingOpen && !voted && user && !isParty && (
              <div className="mt-6">
                {!isConnected && (
                  <div className="mb-4 p-4 rounded-xl bg-[#ef233c]/5 border border-[#ef233c]/20 text-center">
                    <Wallet className="w-5 h-5 text-[#ef233c] mx-auto mb-2" />
                    <p className="text-sm text-zinc-400 mb-3">
                      Connect your Pera Wallet to vote. A 0.001 ALGO gas fee will be sent to the escrow account.
                    </p>
                    <button
                      onClick={connectWallet}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef233c] text-white text-sm font-medium hover:bg-red-700 transition-all"
                    >
                      <Wallet className="w-4 h-4" />
                      Connect Pera Wallet
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleVote("creator")}
                    disabled={voting}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 disabled:opacity-50"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    {voting ? "Signing..." : "Vote for Creator"}
                  </button>
                  <button
                    onClick={() => handleVote("freelancer")}
                    disabled={voting}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/30 text-[#ef233c] font-medium hover:bg-[#ef233c]/20 hover:border-[#ef233c]/50 transition-all duration-300 disabled:opacity-50"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    {voting ? "Signing..." : "Vote for Freelancer"}
                  </button>
                </div>

                {isConnected && (
                  <p className="text-center text-[10px] text-zinc-500 mt-2">
                    💳 Connected: {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)} • 0.001 ALGO gas fee per vote
                  </p>
                )}
              </div>
            )}

            {/* Party notice */}
            {votingOpen && isParty && (
              <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <p className="text-amber-400 text-sm font-medium">
                  You are a party in this dispute and cannot vote.
                </p>
              </div>
            )}

            {voted && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 font-medium">
                  Your vote for <span className="font-bold">{voteChoice}</span> has been recorded on-chain!
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  0.001 ALGO gas fee was sent to the escrow account.
                </p>
              </div>
            )}

            {/* Finalize button */}
            {votingExpired && (
              <div className="mt-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center mb-4">
                  <Gavel className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm mb-1">
                    Voting period has ended. The dispute can now be finalized.
                  </p>
                  <p className="text-zinc-500 text-xs mb-3">
                    {tally.creator > tally.freelancer
                      ? "Creator wins — ALGO will be refunded to creator from escrow."
                      : tally.freelancer > tally.creator
                      ? "Freelancer wins — ALGO will be sent to freelancer from escrow."
                      : "Tie — Creator wins by default. ALGO will be refunded to creator."}
                  </p>
                  <button
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ef233c] text-white font-medium hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    <Gavel className="w-4 h-4" />
                    {finalizing ? "Finalizing..." : "Finalize Dispute"}
                  </button>
                </div>
              </div>
            )}

            {/* Resolution result */}
            {isResolved && (
              <div className={`mt-4 p-5 rounded-xl border text-center ${
                dispute.status === "resolved_freelancer"
                  ? "bg-[#ef233c]/10 border-[#ef233c]/30"
                  : "bg-blue-500/10 border-blue-500/30"
              }`}>
                <Gavel className={`w-8 h-8 mx-auto mb-2 ${
                  dispute.status === "resolved_freelancer" ? "text-[#ef233c]" : "text-blue-400"
                }`} />
                <p className={`text-lg font-[var(--font-heading)] font-bold mb-1 ${
                  dispute.status === "resolved_freelancer" ? "text-[#ef233c]" : "text-blue-400"
                }`}>
                  {dispute.status === "resolved_freelancer" ? "🏆 Freelancer Won" : "🏆 Creator Won"}
                </p>
                <p className="text-sm text-zinc-400">
                  {dispute.bounty.reward_algo.toFixed(2)} ALGO released from escrow to the {dispute.status === "resolved_freelancer" ? "freelancer" : "creator"}.
                </p>
                {dispute.resolution_txn_id && (
                  <a
                    href={`https://testnet.algoexplorer.io/tx/${dispute.resolution_txn_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#ef233c] hover:underline mt-2"
                  >
                    <ExternalLink className="w-3 h-3" /> View Resolution Tx
                  </a>
                )}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Vote History */}
        <ScrollReveal delay={0.15}>
          <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6">
            <h2 className="text-lg font-[var(--font-heading)] font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ef233c]" />
              Vote History ({votes.length})
            </h2>

            {votes.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">
                No votes have been cast yet. Be the first to vote!
              </p>
            ) : (
              <div className="space-y-3">
                {votes.map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        vote.vote === "creator" ? "bg-blue-500/10" : "bg-[#ef233c]/10"
                      }`}>
                        {vote.vote === "creator" ? (
                          <ThumbsUp className="w-4 h-4 text-blue-400" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-[#ef233c]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {vote.voter.display_name || vote.voter.username}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Voted for {vote.vote} • {new Date(vote.voted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {vote.vote_txn_id && (
                      <a
                        href={`https://testnet.algoexplorer.io/tx/${vote.vote_txn_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#ef233c] hover:underline flex items-center gap-1"
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
