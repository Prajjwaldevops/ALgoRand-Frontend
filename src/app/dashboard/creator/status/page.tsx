"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  dashboardApi,
  bountyApi,
  type DashboardBounty,
  type Submission,
} from "@/lib/api";
import { useWallet } from "@/context/WalletContext";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import {
  Activity,
  Clock,
  ArrowRight,
  Briefcase,
  User,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  Download,
  Star,
  Loader2,
  AlertTriangle,
  Lock,
  MessageSquare,
  Timer,
  Hash,
  Wallet,
} from "lucide-react";

export default function CreatorStatusPage() {
  const [bounties, setBounties] = useState<DashboardBounty[]>([]);
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [selectedBounty, setSelectedBounty] = useState<DashboardBounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState(false);

  // Reject form state
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Approve form state
  const [approvingSubId, setApprovingSubId] = useState<string | null>(null);
  const [approveFormSubId, setApproveFormSubId] = useState<string | null>(null);
  const [approveRating, setApproveRating] = useState(5);
  const [approveMessage, setApproveMessage] = useState("");
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [approveStep, setApproveStep] = useState<string>("");
  const [payoutTxnHash, setPayoutTxnHash] = useState<string | null>(null);

  const { accountAddress, isConnected, connectWallet, signTransactionGroup } = useWallet();

  const fetchBounties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.myBounties();
      if (res.success && res.data) {
        // Show all in_progress bounties (even with 0 submissions)
        const approved = res.data.filter(
          (b: DashboardBounty) =>
            b.status === "completed" || b.status === "in_progress"
        );
        setBounties(approved);
        if (approved.length > 0 && !selectedBountyId) {
          setSelectedBountyId(approved[0].id);
          setSelectedBounty(approved[0]);
        }
      }
    } catch {
      /* defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubmissions = useCallback(
    async (bountyId: string) => {
      setSubsLoading(true);
      try {
        const res = await bountyApi.submissions(bountyId);
        if (res.success && res.data) {
          setSubmissions(Array.isArray(res.data) ? res.data : []);
        } else {
          setSubmissions([]);
        }
      } catch {
        setSubmissions([]);
      } finally {
        setSubsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchBounties();
  }, [fetchBounties]);

  useEffect(() => {
    if (selectedBountyId) {
      fetchSubmissions(selectedBountyId);
      const found = bounties.find((b) => b.id === selectedBountyId);
      setSelectedBounty(found || null);
    }
  }, [selectedBountyId, fetchSubmissions, bounties]);

  const handleApprove = async () => {
    if (!approveFormSubId || !selectedBountyId) return;

    setApproveSubmitting(true);
    setApprovingSubId(approveFormSubId);
    setPayoutTxnHash(null);
    try {
      // ESCROW BYPASS: Backend handles the payout directly — no Pera signing needed
      setApproveStep("Approving and releasing escrow funds...");
      const res = await bountyApi.approve(
        selectedBountyId,
        approveFormSubId,
        approveRating,
        approveMessage.trim() || undefined,
        [] // No signed txns needed — backend uses escrow bypass
      );
      if (res.success) {
        const txnHash = (res.data as { payout_txn_hash?: string })?.payout_txn_hash;
        setPayoutTxnHash(txnHash || null);
        setApproveFormSubId(null);
        setApproveRating(5);
        setApproveMessage("");
        fetchSubmissions(selectedBountyId);
        fetchBounties();
        alert(`✅ Work accepted! Escrow funds released to freelancer.${txnHash ? `\nTransaction: ${txnHash}` : ""}`);
      } else {
        alert(res.error || "Failed to approve submission");
      }
    } catch (e: unknown) {
      console.error(e);
      alert("Approval failed — check console for details");
    } finally {
      setApproveSubmitting(false);
      setApprovingSubId(null);
      setApproveStep("");
    }
  };

  const handleReject = async () => {
    if (!rejectingSubId || !selectedBountyId) return;
    if (rejectFeedback.trim().length < 50) {
      alert("Rejection feedback must be at least 50 characters. Please provide detailed feedback.");
      return;
    }
    setRejectSubmitting(true);
    try {
      const res = await bountyApi.reject(selectedBountyId, rejectingSubId, rejectFeedback.trim());
      if (res.success) {
        setRejectingSubId(null);
        setRejectFeedback("");
        fetchSubmissions(selectedBountyId);
        fetchBounties();
      } else {
        alert(res.error || "Failed to reject submission");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRejectSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-12 bg-vault-text-muted/10 rounded-xl w-1/3" />
        <div className="h-64 bg-vault-text-muted/10 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <ScrollReveal>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-heading)] flex items-center gap-2">
              <Activity className="w-6 h-6 text-vault-cyan" /> Bounty Status
            </h1>
            <p className="text-sm text-vault-text-secondary mt-1">
              Review freelancer submissions, accept or reject work
            </p>
          </div>
          {!isConnected && (
            <Button variant="secondary" size="sm" onClick={connectWallet}>
              <Wallet className="w-4 h-4" /> Connect Wallet
            </Button>
          )}
        </div>
      </ScrollReveal>

      {bounties.length === 0 ? (
        <div className="glass-card p-10 text-center rounded-2xl">
          <Briefcase className="w-12 h-12 text-vault-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bounties yet</h3>
          <p className="text-sm text-vault-text-secondary">
            Create a bounty to see status updates here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bounty Selector */}
          <ScrollReveal delay={0.1}>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-vault-text-muted mb-3">
                Select Bounty
              </h3>
              {bounties.map((bounty) => (
                <button
                  key={bounty.id}
                  onClick={() => setSelectedBountyId(bounty.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all text-sm ${
                    selectedBountyId === bounty.id
                      ? "glass-card border-vault-purple/30 bg-vault-purple/5"
                      : "glass hover:bg-white/5"
                  }`}
                >
                  <p className="font-medium line-clamp-1">{bounty.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-vault-text-muted capitalize">
                      {bounty.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-vault-text-muted">·</span>
                    <span className="text-xs text-vault-text-muted flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {bounty.submission_count} submissions
                    </span>
                  </div>
                  <span className="text-xs font-medium gradient-text">
                    {formatAlgo(bounty.reward_algo)} ALGO
                  </span>
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Bounty Detail + Submissions */}
          <ScrollReveal delay={0.15} className="lg:col-span-2">
            {selectedBounty ? (
              <div className="space-y-5">
                {/* Bounty Info Card */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge status={selectedBounty.status} />
                        <span className="text-xs text-vault-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDeadline(selectedBounty.deadline)}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold font-[var(--font-heading)] mb-2">
                        {selectedBounty.title}
                      </h2>
                    </div>
                    <span className="text-xl font-bold gradient-text flex-shrink-0 ml-3">
                      {formatAlgo(selectedBounty.reward_algo)} ALGO
                    </span>
                  </div>
                  <p className="text-xs text-vault-text-secondary leading-relaxed whitespace-pre-wrap mb-4">
                    {selectedBounty.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-vault-text-muted pt-3 border-t border-vault-border">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-vault-purple-light" />
                      {submissions.length} / {selectedBounty.max_submissions} submissions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-vault-cyan" />
                      {formatDeadline(selectedBounty.deadline)}
                    </span>
                  </div>
                </div>

                {/* Submissions List */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-vault-cyan" /> Submissions (
                    {submissions.length})
                  </h3>

                  {subsLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-24 bg-vault-text-muted/10 rounded-xl" />
                      ))}
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-10">
                      <FileText className="w-10 h-10 text-vault-text-muted mx-auto mb-3" />
                      <p className="text-sm text-vault-text-secondary">
                        No submissions yet for this bounty.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map((sub, i) => (
                        <div
                          key={sub.id}
                          className="glass p-4 rounded-xl border border-vault-border/50"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          {/* Submission Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-vault-purple/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-vault-purple-light" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {sub.freelancer?.username || "Freelancer"}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-vault-text-muted">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-vault-amber" />
                                    {sub.freelancer?.reputation_score || 0}
                                  </span>
                                  {sub.submission_number && (
                                    <span>Submission #{sub.submission_number}</span>
                                  )}
                                  {sub.created_at && (
                                    <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge status={sub.status} />
                          </div>

                          {/* Description */}
                          {sub.description && (
                            <p className="text-xs text-vault-text-secondary mb-3 leading-relaxed">
                              {sub.description}
                            </p>
                          )}

                          {/* Work Files — Mega Link + Encryption Key */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                            {/* Mega.nz Link */}
                            {sub.mega_nz_link && (
                              <a
                                href={sub.mega_nz_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-vault-cyan/5 border border-vault-cyan/20 hover:bg-vault-cyan/10 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4 text-vault-cyan" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-vault-cyan">Mega.nz Link</p>
                                  <p className="text-[10px] text-vault-text-muted truncate">{sub.mega_nz_link}</p>
                                </div>
                              </a>
                            )}

                            {/* Encryption Key Download */}
                            {sub.encryption_key_url && (
                              <a
                                href={sub.encryption_key_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-vault-amber/5 border border-vault-amber/20 hover:bg-vault-amber/10 transition-colors"
                              >
                                <Lock className="w-4 h-4 text-vault-amber" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-vault-amber">Encryption Key</p>
                                  <p className="text-[10px] text-vault-text-muted">Download .txt key file</p>
                                </div>
                                <Download className="w-3.5 h-3.5 text-vault-amber" />
                              </a>
                            )}
                          </div>

                          {/* Work Hash */}
                          {sub.work_hash_sha256 && (
                            <div className="glass p-2 rounded-lg mb-3">
                              <p className="text-[10px] text-vault-text-muted">Work Hash (SHA256)</p>
                              <p className="text-[10px] font-mono text-vault-cyan break-all">
                                {sub.work_hash_sha256}
                              </p>
                            </div>
                          )}

                          {/* Previous rejection feedback (if this is a resubmission) */}
                          {sub.rejection_feedback && sub.status === "rejected" && (
                            <div className="glass p-3 rounded-lg mb-3 border border-vault-red/20 bg-vault-red/5">
                              <p className="text-xs font-medium text-vault-red flex items-center gap-1 mb-1">
                                <XCircle className="w-3 h-3" /> Your Rejection Feedback:
                              </p>
                              <p className="text-xs text-vault-text-secondary whitespace-pre-wrap">
                                {sub.rejection_feedback}
                              </p>
                            </div>
                          )}

                          {/* Actions — Only for pending submissions */}
                          {sub.status === "pending" && (
                            <>
                              {rejectingSubId === sub.id ? (
                                /* Rejection Form */
                                <div className="space-y-3 pt-3 border-t border-vault-border/50">
                                  <h4 className="text-xs font-semibold text-vault-red flex items-center gap-1.5">
                                    <XCircle className="w-4 h-4" /> Reject Submission
                                  </h4>
                                  <p className="text-xs text-vault-text-secondary">
                                    Provide detailed feedback explaining what needs to be improved.
                                    Minimum 50 characters required.
                                  </p>
                                  <textarea
                                    value={rejectFeedback}
                                    onChange={(e) => setRejectFeedback(e.target.value)}
                                    placeholder="Explain what is wrong and what improvements need to be made. Be specific about issues and provide clear guidance for resubmission..."
                                    rows={5}
                                    className="w-full bg-vault-bg/50 border border-vault-red/30 rounded-xl px-4 py-3 text-sm
                                      focus:outline-none focus:ring-2 focus:ring-vault-red/40 focus:border-vault-red
                                      placeholder:text-vault-text-muted/50 transition-all resize-none"
                                  />
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs ${
                                      rejectFeedback.trim().length < 50 ? "text-vault-red" : "text-vault-green"
                                    }`}>
                                      {rejectFeedback.trim().length} / 50 min characters
                                    </span>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={handleReject}
                                        loading={rejectSubmitting}
                                        disabled={rejectFeedback.trim().length < 50}
                                      >
                                        <XCircle className="w-4 h-4" /> Confirm Rejection
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setRejectingSubId(null);
                                          setRejectFeedback("");
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : approveFormSubId === sub.id ? (
                                /* Approval Form */
                                <div className="space-y-3 pt-3 border-t border-vault-border/50">
                                  <h4 className="text-xs font-semibold text-vault-green flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4" /> Accept Work &amp; Release Funds
                                  </h4>

                                  {/* Rating */}
                                  <div className="space-y-1.5">
                                    <label className="text-xs text-vault-text-muted">
                                      Rate this work <span className="text-vault-red">*</span>
                                    </label>
                                    <div className="flex gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setApproveRating(star)}
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                            star <= approveRating
                                              ? "bg-vault-amber/20 text-vault-amber"
                                              : "bg-vault-bg/30 text-vault-text-muted hover:text-vault-amber"
                                          }`}
                                        >
                                          <Star className={`w-4 h-4 ${star <= approveRating ? "fill-current" : ""}`} />
                                        </button>
                                      ))}
                                      <span className="text-xs text-vault-text-muted ml-2 self-center">
                                        {approveRating}/5
                                      </span>
                                    </div>
                                  </div>

                                  {/* Message */}
                                  <div className="space-y-1.5">
                                    <label className="text-xs text-vault-text-muted">
                                      Feedback message (optional)
                                    </label>
                                    <textarea
                                      value={approveMessage}
                                      onChange={(e) => setApproveMessage(e.target.value)}
                                      placeholder="Great work! Everything looks perfect..."
                                      rows={2}
                                      className="w-full bg-vault-bg/50 border border-vault-green/30 rounded-xl px-4 py-2 text-sm
                                        focus:outline-none focus:ring-2 focus:ring-vault-green/40 focus:border-vault-green
                                        placeholder:text-vault-text-muted/50 transition-all resize-none"
                                    />
                                  </div>

                                  {approveStep && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-vault-cyan/5 border border-vault-cyan/20">
                                      <Loader2 className="w-3.5 h-3.5 text-vault-cyan animate-spin" />
                                      <span className="text-xs text-vault-cyan">{approveStep}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-vault-text-muted">
                                      Escrowed ALGO will be sent to the freelancer
                                    </p>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleApprove}
                                        loading={approveSubmitting}
                                        disabled={approveSubmitting}
                                      >
                                        <CheckCircle className="w-4 h-4" /> Approve &amp; Pay
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setApproveFormSubId(null);
                                          setApproveRating(5);
                                          setApproveMessage("");
                                        }}
                                        disabled={approveSubmitting}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Accept / Reject Buttons */
                                <div className="flex items-center gap-2 pt-3 border-t border-vault-border/50">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setApproveFormSubId(sub.id)}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="w-4 h-4" /> Accept Work
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setRejectingSubId(sub.id)}
                                    className="flex-1"
                                  >
                                    <XCircle className="w-4 h-4" /> Reject Work
                                  </Button>
                                </div>
                              )}
                            </>
                          )}

                          {/* Approved badge */}
                          {sub.status === "approved" && (
                            <div className="flex items-center gap-2 pt-3 border-t border-vault-border/50 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vault-green/10 text-vault-green text-xs font-medium">
                                <CheckCircle className="w-3 h-3" /> Work Accepted — Payment Sent
                              </span>
                              {payoutTxnHash && (
                                <a
                                  href={`https://testnet.explorer.perawallet.app/tx/${payoutTxnHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-vault-cyan/5 border border-vault-cyan/20 text-vault-cyan text-[10px] font-mono hover:bg-vault-cyan/10 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {payoutTxnHash.slice(0, 8)}...{payoutTxnHash.slice(-6)}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-10 text-center">
                <Activity className="w-10 h-10 text-vault-text-muted mx-auto mb-3" />
                <p className="text-sm text-vault-text-secondary">
                  Select a bounty to view details and submissions.
                </p>
              </div>
            )}
          </ScrollReveal>
        </div>
      )}
    </div>
  );
}
