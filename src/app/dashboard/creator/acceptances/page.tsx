"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { acceptanceApi, type BountyAcceptance } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import {
  HandshakeIcon, Clock, CheckCircle, XCircle, Loader2,
  Star, User, Briefcase, ArrowRight, Wallet, Eye,
} from "lucide-react";

export default function CreatorAcceptancesPage() {
  const [acceptances, setAcceptances] = useState<BountyAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const { accountAddress, isConnected, connectWallet, signTransactionGroup } = useWallet();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await acceptanceApi.pendingForCreator();
      if (res.success && res.data) {
        setAcceptances(res.data);
      }
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (bountyId: string, freelancerId: string) => {
    if (!isConnected || !accountAddress) {
      await connectWallet();
      return;
    }

    setActionLoading(freelancerId);
    try {
      // Step 1: Request escrow transaction from backend
      const reviewRes = await acceptanceApi.review(bountyId, freelancerId, "approve", accountAddress);
      if (!reviewRes.success) {
        alert(reviewRes.error || "Failed to initiate approval");
        return;
      }

      // The backend wraps txns in UnsignedTxnResult: { transactions: [...], group_id, message }
      const txnResult = reviewRes.data?.transactions as unknown as
        | { transactions?: string[]; group_id?: string; message?: string }
        | undefined;
      const txns = txnResult?.transactions;
      if (!txns || !Array.isArray(txns) || txns.length === 0) {
        alert("No transactions returned from backend");
        return;
      }

      // Step 2: Sign with Pera Wallet
      const signedTxns = await signTransactionGroup(txns);

      // Step 3: Confirm with backend
      const confirmRes = await acceptanceApi.confirm(bountyId, freelancerId, signedTxns);
      if (confirmRes.success) {
        // Update local state
        setAcceptances((prev) =>
          prev.map((a) =>
            a.bounty_id === bountyId && a.freelancer_id === freelancerId
              ? { ...a, status: "approved" as const }
              : a.bounty_id === bountyId && a.status === "pending"
                ? { ...a, status: "rejected" as const, creator_note: "Another freelancer was selected" }
                : a
          )
        );
        alert("Freelancer approved! Escrow is now locked on-chain.");
      } else {
        alert(confirmRes.error || "Failed to confirm");
      }
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Approval failed. Check console for details.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bountyId: string, freelancerId: string) => {
    const note = prompt("Optional reason for rejection:");
    setActionLoading(freelancerId);
    try {
      const res = await acceptanceApi.review(bountyId, freelancerId, "reject", undefined, note || undefined);
      if (res.success) {
        setAcceptances((prev) =>
          prev.map((a) =>
            a.bounty_id === bountyId && a.freelancer_id === freelancerId
              ? { ...a, status: "rejected" as const, creator_note: note || undefined }
              : a
          )
        );
      } else {
        alert(res.error || "Failed to reject");
      }
    } catch (err) {
      console.error("Rejection failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === "all"
    ? acceptances
    : acceptances.filter((a) => a.status === filter);

  // Group by bounty
  const groupedByBounty: Record<string, BountyAcceptance[]> = {};
  filtered.forEach((acc) => {
    if (!groupedByBounty[acc.bounty_id]) {
      groupedByBounty[acc.bounty_id] = [];
    }
    groupedByBounty[acc.bounty_id].push(acc);
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-4">
        <div className="h-10 bg-vault-text-muted/10 rounded-2xl w-1/3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-vault-text-muted/10 rounded-2xl" />
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
            <h1 className="text-2xl font-bold font-[var(--font-heading)] flex items-center gap-3">
              <HandshakeIcon className="w-6 h-6 text-vault-purple-light" />
              Review Acceptances
            </h1>
            <p className="text-sm text-vault-text-secondary mt-1">
              Freelancer requests to work on your bounties
            </p>
          </div>
          {!isConnected && (
            <Button variant="secondary" size="sm" onClick={connectWallet}>
              <Wallet className="w-4 h-4" /> Connect Wallet
            </Button>
          )}
        </div>
      </ScrollReveal>

      {/* Filters */}
      <ScrollReveal delay={0.05}>
        <div className="flex gap-1 glass p-1 rounded-xl w-fit">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === f
                  ? "bg-vault-purple text-white shadow-lg shadow-vault-purple/20"
                  : "text-vault-text-secondary hover:text-vault-text"
              }`}
            >
              {f}
              {f !== "all" && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  filter === f ? "bg-white/20" : "bg-vault-purple/10 text-vault-purple-light"
                }`}>
                  {acceptances.filter((a) => a.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Empty State */}
      {Object.keys(groupedByBounty).length === 0 && (
        <ScrollReveal delay={0.1}>
          <div className="glass-card p-10 text-center rounded-2xl">
            <HandshakeIcon className="w-12 h-12 text-vault-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No acceptance requests</h3>
            <p className="text-sm text-vault-text-secondary mb-6">
              When freelancers request to work on your bounties, they&apos;ll appear here.
            </p>
            <Link href="/dashboard/creator/bounties">
              <Button variant="primary">
                <Briefcase className="w-4 h-4" /> My Bounties
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      )}

      {/* Grouped by Bounty */}
      {Object.entries(groupedByBounty).map(([bountyId, accs], groupIndex) => {
        const bountyInfo = accs[0]?.bounty;
        return (
          <ScrollReveal key={bountyId} delay={0.1 + groupIndex * 0.05}>
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Bounty Header */}
              <div className="p-5 border-b border-vault-border/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {bountyInfo?.status && <Badge status={bountyInfo.status} />}
                      <span className="text-lg font-bold gradient-text">
                        {bountyInfo ? formatAlgo(bountyInfo.reward_algo) : "—"} ALGO
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-1">
                      {bountyInfo?.title || "Untitled"}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-vault-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {bountyInfo?.deadline ? formatDeadline(bountyInfo.deadline) : "—"}
                      </span>
                      <span>{accs.length} applicant{accs.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <Link href={`/bounties/${bountyId}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" /> View
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Freelancer Requests */}
              <div className="divide-y divide-vault-border/30">
                {accs.map((acc) => {
                  const fl = acc.freelancer;
                  const isExpanded = expandedProfile === acc.id;

                  return (
                    <div key={acc.id} className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vault-cyan to-vault-green flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {fl?.avatar_url ? (
                            <img src={fl.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            (fl?.display_name || fl?.username)?.charAt(0).toUpperCase() || "F"
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{fl?.display_name || fl?.username || "Unknown"}</span>
                            <span className="text-xs text-vault-text-muted">@{fl?.username}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-vault-text-muted">
                            <span className="flex items-center gap-1 text-vault-amber">
                              <Star className="w-3 h-3" />
                              {fl?.reputation_score || 0} rep
                            </span>
                            <span>{fl?.total_bounties_completed || 0} completed</span>
                            {fl?.avg_rating ? (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {fl.avg_rating.toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                          {acc.message && (
                            <p className="text-xs text-vault-text-secondary mt-1 line-clamp-1 italic">
                              &quot;{acc.message}&quot;
                            </p>
                          )}
                        </div>

                        {/* Status / Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {acc.status === "pending" ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExpandedProfile(isExpanded ? null : acc.id)}
                              >
                                <User className="w-4 h-4" />
                              </Button>
                              <button
                                onClick={() => handleApprove(acc.bounty_id, acc.freelancer_id!)}
                                disabled={actionLoading === acc.freelancer_id}
                                className="p-2 rounded-xl bg-vault-green/10 text-vault-green hover:bg-vault-green/20 transition-colors disabled:opacity-50"
                                title="Approve & Lock Escrow"
                              >
                                {actionLoading === acc.freelancer_id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(acc.bounty_id, acc.freelancer_id!)}
                                disabled={actionLoading === acc.freelancer_id}
                                className="p-2 rounded-xl bg-vault-red/10 text-vault-red hover:bg-vault-red/20 transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg font-medium ${
                              acc.status === "approved" ? "bg-vault-green/10 text-vault-green" : "bg-vault-red/10 text-vault-red"
                            }`}>
                              {acc.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Profile View */}
                      {isExpanded && fl && (
                        <div className="mt-4 ml-14 p-4 rounded-xl bg-vault-white/5 border border-vault-border/30 space-y-3">
                          <h4 className="text-xs font-semibold text-vault-text-muted uppercase tracking-wider">
                            Freelancer Profile
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="glass p-3 rounded-xl">
                              <div className="text-lg font-bold text-vault-amber">{fl.reputation_score}</div>
                              <div className="text-[10px] text-vault-text-muted">Reputation</div>
                            </div>
                            <div className="glass p-3 rounded-xl">
                              <div className="text-lg font-bold text-vault-green">{fl.total_bounties_completed}</div>
                              <div className="text-[10px] text-vault-text-muted">Completed</div>
                            </div>
                            <div className="glass p-3 rounded-xl">
                              <div className="text-lg font-bold text-vault-cyan">
                                {fl.avg_rating ? fl.avg_rating.toFixed(1) : "—"}
                              </div>
                              <div className="text-[10px] text-vault-text-muted">Rating</div>
                            </div>
                            <div className="glass p-3 rounded-xl">
                              <div className="text-lg font-bold text-vault-purple-light">{fl.total_ratings}</div>
                              <div className="text-[10px] text-vault-text-muted">Reviews</div>
                            </div>
                          </div>
                          {fl.bio && (
                            <p className="text-xs text-vault-text-secondary leading-relaxed">
                              {fl.bio}
                            </p>
                          )}
                          {acc.message && (
                            <div className="p-3 rounded-lg bg-vault-purple/5 border border-vault-purple/10">
                              <p className="text-[10px] text-vault-text-muted uppercase tracking-wider mb-1">Cover Message</p>
                              <p className="text-xs text-vault-text-secondary">{acc.message}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
