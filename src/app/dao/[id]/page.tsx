"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { daoApi, type DAOVote, type DisputeDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  Scale,
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
  Hash,
  FileText,
  MessageSquare,
  XCircle,
  Copy,
  Clock,
  AlertTriangle,
  Wallet,
  Ban,
  Zap,
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
      // Load full dispute detail
      const detailRes = await daoApi.getDisputeDetail(disputeId);
      if (detailRes.success && detailRes.data) {
        setDispute(detailRes.data);
        setTally(detailRes.data.votes);
      }

      // Load votes
      const votesRes = await daoApi.getDisputeVotes(disputeId);
      if (votesRes.data) {
        setVotes(votesRes.data.votes || []);
        if (votesRes.data.tally) setTally(votesRes.data.tally);

        // Auto-detect if current user already voted
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

  // Load voting compliance status
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

    // Enable live voting / live updates — poll every 5 seconds
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadData, loadVotingStatus]);

  const handleVote = async (vote: "creator" | "freelancer") => {
    setVoting(true);
    setVoteError(null);

    try {
      // Step 1: Ensure wallet is connected
      if (!isConnected || !accountAddress) {
        await connectWallet();
        // After connecting, accountAddress may not be immediately available
        // We'll retry after a brief delay
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

      // Step 2: Build unsigned grouped txn: Payment(0.001 ALGO → escrow) + AppCall(cast_dao_vote)
      const buildRes = await daoApi.buildVoteTxn(disputeId, walletAddr, vote);
      if (!buildRes.success || !buildRes.data) {
        setVoteError(buildRes.error || "Failed to build vote transaction");
        setVoting(false);
        return;
      }

      // Step 3: Sign both transactions (Payment + AppCall) with Pera Wallet
      const signedTxns = await signTransactionGroup(buildRes.data.transactions);

      // Step 4: Submit signed transaction + vote
      const res = await daoApi.castVote(disputeId, vote, signedTxns);
      if (res.success) {
        setVoted(true);
        setVoteChoice(vote);
        // Immediately update tallies from response
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
      // User closed Pera modal — not an error
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
      // Step 1: Ensure wallet is connected
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

      // Step 2: Build unsigned resolve_dao_dispute() app call
      const buildRes = await daoApi.buildFinalizeTxn(disputeId, walletAddr);
      if (!buildRes.success || !buildRes.data) {
        // Fallback: submit without signed txns (escrow bypass)
        const res = await daoApi.finalize(disputeId);
        if (res.success) { loadData(); } else { setVoteError(res.error || "Finalization failed"); }
        setFinalizing(false);
        return;
      }

      // Step 3: Sign with Pera Wallet
      const signedTxns = await signTransactionGroup(buildRes.data.transactions);

      // Step 4: Submit signed resolve_dao_dispute() tx
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
      // Fallback: try without signed txns
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
  const votingExpired = new Date(dispute.voting_deadline) <= new Date() && dispute.status === "open";
  const isParty = user && (user.id === dispute.freelancer_id || user.id === dispute.creator_id);
  const isResolved = dispute.status !== "open";

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link href="/dao" className="inline-flex items-center gap-2 text-vault-text-secondary hover:text-vault-purple transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to DAO Court</span>
        </Link>

        {/* Voting Compliance Banner */}
        {user && votingStatus && !votingStatus.is_compliant && (
          <ScrollReveal>
            <div className="mb-6 p-4 rounded-2xl bg-vault-red/10 border border-vault-red/30">
              <div className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-vault-red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-vault-red font-semibold text-sm">⚠️ Monthly Voting Required</p>
                  <p className="text-vault-text-secondary text-xs mt-1">
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
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-vault-purple font-bold">{dispute.dispute_id}</span>
                  {votingOpen ? (
                    <span className="px-2 py-0.5 rounded-full bg-vault-green/15 text-vault-green text-xs font-medium animate-pulse">
                      🔴 Live Voting
                    </span>
                  ) : isResolved ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      dispute.status === "resolved_freelancer"
                        ? "bg-vault-purple/15 text-vault-purple"
                        : "bg-vault-cyan/15 text-vault-cyan"
                    }`}>
                      {dispute.status === "resolved_freelancer" ? "🏆 Freelancer Won" : "🏆 Creator Won"}
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
        <ScrollReveal delay={0.05}>
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

        {/* Freelancer's Dispute Description */}
        <ScrollReveal delay={0.075}>
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-heading font-semibold text-vault-text mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-vault-purple" />
              Freelancer&apos;s Dispute Statement
            </h2>
            <div className="bg-vault-bg/40 rounded-xl p-4 border border-vault-border/30">
              <p className="text-sm text-vault-text-secondary leading-relaxed whitespace-pre-wrap">
                {dispute.freelancer_description}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Conversation History — Submissions & Rejections */}
        {dispute.conversation && dispute.conversation.length > 0 && (
          <ScrollReveal delay={0.1}>
            <div className="glass-card rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-heading font-semibold text-vault-text mb-5 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-vault-cyan" />
                Submission &amp; Review History
              </h2>

              <div className="space-y-4">
                {dispute.conversation.map((entry, i) => (
                  <div key={i} className="relative">
                    {/* Timeline connector */}
                    {i < dispute.conversation.length - 1 && (
                      <div className="absolute left-5 top-12 bottom-0 w-px bg-vault-border/30" />
                    )}

                    <div className="glass rounded-xl p-4 border border-vault-border/20">
                      {/* Submission Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-vault-purple/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-vault-purple" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-vault-text">
                              Submission #{entry.submission_number}
                            </p>
                            <p className="text-[10px] text-vault-text-muted">
                              <Clock className="w-3 h-3 inline mr-0.5" />
                              {new Date(entry.submitted_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          entry.status === "approved" ? "bg-vault-green/15 text-vault-green" :
                          entry.status === "rejected" ? "bg-vault-red/15 text-vault-red" :
                          "bg-vault-amber/15 text-vault-amber"
                        }`}>
                          {entry.status}
                        </span>
                      </div>

                      {/* Freelancer's Description */}
                      <div className="mb-3 pl-12">
                        <p className="text-xs text-vault-text-muted mb-1 font-medium">Freelancer&apos;s Description:</p>
                        <p className="text-sm text-vault-text-secondary leading-relaxed">
                          {entry.description}
                        </p>
                      </div>

                      {/* Work Hash */}
                      {entry.work_hash && (
                        <div className="mb-3 pl-12">
                          <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3 text-vault-cyan flex-shrink-0" />
                            <span className="text-[10px] text-vault-text-muted font-medium">Work Hash:</span>
                            <code className="text-[10px] font-mono text-vault-cyan bg-vault-bg/60 px-2 py-0.5 rounded flex-1 truncate">
                              {entry.work_hash}
                            </code>
                            <button
                              onClick={() => copyToClipboard(entry.work_hash)}
                              className="p-1 hover:bg-vault-purple/10 rounded transition-colors"
                              title="Copy hash"
                            >
                              {copiedHash === entry.work_hash ? (
                                <CheckCircle className="w-3 h-3 text-vault-green" />
                              ) : (
                                <Copy className="w-3 h-3 text-vault-text-muted" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Creator's Rejection Feedback */}
                      {entry.rejection_feedback && entry.rejection_feedback.length > 0 && (
                        <div className="pl-12 mt-3 pt-3 border-t border-vault-border/20">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded bg-vault-red/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <XCircle className="w-3.5 h-3.5 text-vault-red" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-vault-red font-medium mb-1">Creator&apos;s Rejection Feedback:</p>
                              <p className="text-sm text-vault-text-secondary italic leading-relaxed">
                                &ldquo;{entry.rejection_feedback}&rdquo;
                              </p>
                              {entry.reviewed_at && (
                                <p className="text-[10px] text-vault-text-muted mt-1">
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
          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-heading font-semibold text-vault-text mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-vault-purple" />
              Vote Tally
              {votingOpen && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-vault-green/15 text-vault-green text-[10px] font-medium animate-pulse">
                  <Zap className="w-3 h-3 inline mr-0.5" /> LIVE
                </span>
              )}
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
                  className="bg-gradient-to-r from-vault-cyan to-vault-cyan/60 transition-all duration-700 ease-out rounded-l-full"
                  style={{ width: `${creatorPct}%` }}
                />
                <div
                  className="bg-gradient-to-r from-vault-purple/60 to-vault-purple transition-all duration-700 ease-out rounded-r-full"
                  style={{ width: `${freelancerPct}%` }}
                />
              </div>
              <p className="text-center text-xs text-vault-text-muted mt-2">
                {totalVotes} total vote{totalVotes !== 1 ? "s" : ""} cast
              </p>
            </div>

            {/* Vote Error */}
            {voteError && (
              <div className="mt-4 p-3 rounded-xl bg-vault-red/10 border border-vault-red/20 text-center">
                <p className="text-vault-red text-sm">{voteError}</p>
              </div>
            )}

            {/* Vote Buttons — Only for 3rd parties with connected wallet */}
            {votingOpen && !voted && user && !isParty && (
              <div className="mt-6">
                {/* Wallet connection prompt */}
                {!isConnected && (
                  <div className="mb-4 p-4 rounded-xl bg-vault-purple/5 border border-vault-purple/20 text-center">
                    <Wallet className="w-5 h-5 text-vault-purple mx-auto mb-2" />
                    <p className="text-sm text-vault-text-secondary mb-3">
                      Connect your Pera Wallet to vote. A 0.001 ALGO gas fee will be sent to the escrow account.
                    </p>
                    <button
                      onClick={connectWallet}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-vault-purple text-white text-sm font-medium hover:bg-vault-purple/90 transition-all"
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
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-vault-cyan/10 border border-vault-cyan/30 text-vault-cyan font-medium hover:bg-vault-cyan/20 hover:border-vault-cyan/50 transition-all duration-300 disabled:opacity-50"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    {voting ? "Signing..." : "Vote for Creator"}
                  </button>
                  <button
                    onClick={() => handleVote("freelancer")}
                    disabled={voting}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-vault-purple/10 border border-vault-purple/30 text-vault-purple font-medium hover:bg-vault-purple/20 hover:border-vault-purple/50 transition-all duration-300 disabled:opacity-50"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    {voting ? "Signing..." : "Vote for Freelancer"}
                  </button>
                </div>

                {isConnected && (
                  <p className="text-center text-[10px] text-vault-text-muted mt-2">
                    💳 Connected: {accountAddress?.slice(0, 6)}...{accountAddress?.slice(-4)} • 0.001 ALGO gas fee per vote
                  </p>
                )}
              </div>
            )}

            {/* Party notice */}
            {votingOpen && isParty && (
              <div className="mt-4 p-4 rounded-xl bg-vault-amber/5 border border-vault-amber/20 text-center">
                <AlertTriangle className="w-5 h-5 text-vault-amber mx-auto mb-2" />
                <p className="text-vault-amber text-sm font-medium">
                  You are a party in this dispute and cannot vote.
                </p>
              </div>
            )}

            {voted && (
              <div className="mt-4 p-4 rounded-xl bg-vault-green/10 border border-vault-green/20 text-center">
                <CheckCircle className="w-6 h-6 text-vault-green mx-auto mb-2" />
                <p className="text-vault-green font-medium">
                  Your vote for <span className="font-bold">{voteChoice}</span> has been recorded on-chain!
                </p>
                <p className="text-xs text-vault-text-muted mt-1">
                  0.001 ALGO gas fee was sent to the escrow account.
                </p>
              </div>
            )}

            {/* Finalize button — after deadline */}
            {votingExpired && (
              <div className="mt-4">
                <div className="p-4 rounded-xl bg-vault-text-muted/5 border border-vault-border text-center mb-4">
                  <Gavel className="w-6 h-6 text-vault-text-muted mx-auto mb-2" />
                  <p className="text-vault-text-muted text-sm mb-1">
                    Voting period has ended. The dispute can now be finalized.
                  </p>
                  <p className="text-vault-text-muted text-xs mb-3">
                    {tally.creator > tally.freelancer
                      ? "Creator wins — ALGO will be refunded to creator from escrow."
                      : tally.freelancer > tally.creator
                      ? "Freelancer wins — ALGO will be sent to freelancer from escrow."
                      : "Tie — Creator wins by default. ALGO will be refunded to creator."}
                  </p>
                  <button
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-vault-purple text-white font-medium hover:bg-vault-purple/90 transition-all disabled:opacity-50"
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
                  ? "bg-vault-purple/10 border-vault-purple/30"
                  : "bg-vault-cyan/10 border-vault-cyan/30"
              }`}>
                <Gavel className={`w-8 h-8 mx-auto mb-2 ${
                  dispute.status === "resolved_freelancer" ? "text-vault-purple" : "text-vault-cyan"
                }`} />
                <p className={`text-lg font-heading font-bold mb-1 ${
                  dispute.status === "resolved_freelancer" ? "text-vault-purple" : "text-vault-cyan"
                }`}>
                  {dispute.status === "resolved_freelancer" ? "🏆 Freelancer Won" : "🏆 Creator Won"}
                </p>
                <p className="text-sm text-vault-text-secondary">
                  {dispute.bounty.reward_algo.toFixed(2)} ALGO released from escrow to the {dispute.status === "resolved_freelancer" ? "freelancer" : "creator"}.
                </p>
                {dispute.resolution_txn_id && (
                  <a
                    href={`https://testnet.algoexplorer.io/tx/${dispute.resolution_txn_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-vault-purple hover:underline mt-2"
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
                  <div key={vote.id} className="flex items-center justify-between p-3 rounded-xl bg-vault-bg/50 border border-vault-border/50 transition-all duration-300">
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
                          Voted for {vote.vote} • {new Date(vote.voted_at).toLocaleString()}
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
