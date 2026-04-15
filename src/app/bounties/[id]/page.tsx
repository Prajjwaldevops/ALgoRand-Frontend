"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { bountyApi, acceptanceApi, type Bounty, type Submission, type BountyAcceptance } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline, truncateAddress, statusLabel } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Clock, Users, ExternalLink, Upload, CheckCircle,
  XCircle, AlertTriangle, RefreshCw, Star, FileText, Ban,
  HandshakeIcon, Send, Loader2, Timer,
} from "lucide-react";

export default function BountyDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Acceptance state
  const [myAcceptance, setMyAcceptance] = useState<BountyAcceptance | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptMessage, setAcceptMessage] = useState("");
  const [showAcceptForm, setShowAcceptForm] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const bountyRes = await bountyApi.get(id);
        if (bountyRes.success && bountyRes.data) {
          setBounty(bountyRes.data);
        }
        // Submissions require auth
        try {
          const subsRes = await bountyApi.submissions(id);
          if (subsRes.success && subsRes.data) {
            setSubmissions(Array.isArray(subsRes.data) ? subsRes.data : []);
          }
        } catch {
          // Not authenticated
        }
        // Check freelancer's acceptance status
        if (user?.role === "freelancer") {
          try {
            const accRes = await acceptanceApi.myStatus(id);
            if (accRes.success && accRes.data) {
              setMyAcceptance(accRes.data);
            }
          } catch {
            // Not logged in
          }
        }
      } catch (err) {
        console.error("Failed to load bounty:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, user]);

  const handleAcceptBounty = async () => {
    setAcceptLoading(true);
    try {
      const res = await acceptanceApi.accept(id, acceptMessage);
      if (res.success) {
        setMyAcceptance({
          id: res.data?.acceptance_id || "",
          bounty_id: id,
          status: "pending",
          message: acceptMessage || undefined,
          created_at: new Date().toISOString(),
        });
        setShowAcceptForm(false);
        setAcceptMessage("");
      } else {
        alert(res.error || "Failed to accept bounty");
      }
    } catch (err) {
      console.error("Accept failed:", err);
    } finally {
      setAcceptLoading(false);
    }
  };



  const handleApprove = async (submissionId: string, freelancerId?: string) => {
    try {
      const ratingStr = prompt("Rate this work (1-5 stars):", "5");
      const rating = Math.min(5, Math.max(1, parseInt(ratingStr || "5", 10) || 5));
      const message = prompt("Optional feedback for the worker:") || "";

      const approveRes = await bountyApi.approve(id, submissionId, rating, message || undefined);
      if (approveRes.success && freelancerId) {
        await bountyApi.rate(id, freelancerId, rating, message || undefined);
      }
      window.location.reload();
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  const handleReject = async (submissionId: string) => {
    const feedback = prompt("Enter rejection feedback:");
    if (!feedback) return;
    const res = await bountyApi.reject(id, submissionId, feedback);
    if (res.success) window.location.reload();
  };

  const handleRefund = async () => {
    const res = await bountyApi.refundExpired(id);
    if (res.success) window.location.reload();
  };

  const handleLetGo = async () => {
    if (!confirm("Are you sure you want to let go? You will forfeit the bounty entirely and the creator will be refunded.")) return;
    const res = await bountyApi.letGo(id);
    if (res.success) window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-vault-text-muted/10 rounded w-1/3" />
            <div className="h-6 bg-vault-text-muted/10 rounded w-2/3" />
            <div className="h-40 bg-vault-text-muted/10 rounded-2xl" />
            <div className="h-60 bg-vault-text-muted/10 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Bounty not found</h2>
          <p className="text-vault-text-secondary mb-4">
            This bounty may not exist or the backend is not running.
          </p>
          <Link href="/bounties">
            <Button variant="primary">Back to Bounties</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = new Date(bounty.deadline) < new Date();
  const isFreelancer = user?.role === "freelancer";
  const isCreator = user?.role === "creator" && bounty.creator_id === user?.id;
  const canAccept = isFreelancer && bounty.status === "open" && !myAcceptance;
  const hasApprovedAcceptance = myAcceptance?.status === "approved";
  const canSubmitWork = isFreelancer && hasApprovedAcceptance && (bounty.status === "in_progress" || bounty.status === "open");

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link
          href="/bounties"
          className="inline-flex items-center gap-1.5 text-sm text-vault-text-secondary hover:text-vault-text transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bounties
        </Link>

        {/* Header */}
        <ScrollReveal>
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge status={bounty.status} />
              {isExpired && <Badge status="expired" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] mb-2">
              {bounty.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-vault-text-secondary">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDeadline(bounty.deadline)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {bounty.submission_count || 0}/{bounty.max_submissions} submissions
              </span>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <ScrollReveal>
              <Card hover={false} className="p-6">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-vault-purple-light" />
                  Description
                </h2>
                <p className="text-sm text-vault-text-secondary leading-relaxed whitespace-pre-wrap">
                  {bounty.description}
                </p>

                {(bounty.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-vault-border">
                    {(bounty.tags ?? []).map((tag) => (
                      <Badge key={tag} tag={tag} />
                    ))}
                  </div>
                )}
              </Card>
            </ScrollReveal>

            {/* Submissions Leaderboard */}
            <ScrollReveal delay={0.1}>
              <Card hover={false} className="p-6">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-vault-cyan" />
                  Submissions ({submissions.length})
                </h2>

                {submissions.length === 0 ? (
                  <p className="text-sm text-vault-text-muted text-center py-8">
                    No submissions yet. {isFreelancer && hasApprovedAcceptance ? "Submit your work!" : ""}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-vault-text-muted border-b border-vault-border">
                          <th className="text-left py-2 font-medium">Worker</th>
                          <th className="text-left py-2 font-medium">Rep</th>
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-left py-2 font-medium">IPFS</th>
                          <th className="text-right py-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub) => (
                          <tr key={sub.id} className="border-b border-vault-border/50">
                            <td className="py-3">
                              <span className="font-medium">
                                {sub.freelancer?.username || truncateAddress(sub.freelancer_id)}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="flex items-center gap-1 text-vault-amber">
                                <Star className="w-3 h-3" />
                                {sub.freelancer?.reputation_score || 0}
                              </span>
                            </td>
                            <td className="py-3">
                              <Badge status={sub.status} />
                            </td>
                            <td className="py-3">
                              {sub.mega_nz_link && (
                                <a
                                  href={sub.mega_nz_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-vault-cyan hover:underline flex items-center gap-1"
                                >
                                  Mega.nz <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              {sub.status === "pending" && user?.role === "creator" && (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleApprove(sub.id, sub.freelancer_id)}
                                    className="p-1.5 rounded-lg bg-vault-green/10 text-vault-green hover:bg-vault-green/20 transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(sub.id)}
                                    className="p-1.5 rounded-lg bg-vault-red/10 text-vault-red hover:bg-vault-red/20 transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Reward Card */}
            <ScrollReveal direction="right">
              <Card hover={false} className="p-6 text-center gradient-border">
                <p className="text-xs text-vault-text-muted mb-1">Bounty Reward</p>
                <div className="text-3xl font-bold font-[var(--font-heading)] gradient-text mb-1">
                  {formatAlgo(bounty.reward_algo)} ALGO
                </div>
                {bounty.app_id && (
                  <p className="text-xs text-vault-green flex items-center justify-center gap-1 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-vault-green" />
                    Escrow Active (App #{bounty.app_id})
                  </p>
                )}
              </Card>
            </ScrollReveal>

            {/* Accept Bounty (Freelancer) */}
            <ScrollReveal direction="right" delay={0.05}>
              <Card hover={false} className="p-5 space-y-3">
                {/* Accept Bounty Button */}
                {canAccept && (
                  <>
                    {!showAcceptForm ? (
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        onClick={() => setShowAcceptForm(true)}
                        id="accept-bounty-btn"
                      >
                        <HandshakeIcon className="w-4 h-4" />
                        Accept Bounty
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-vault-text-secondary">
                          Send a message to the creator explaining why you&apos;re the right fit:
                        </p>
                        <textarea
                          value={acceptMessage}
                          onChange={(e) => setAcceptMessage(e.target.value)}
                          placeholder="I'd love to work on this bounty because..."
                          className="w-full px-3 py-2 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text placeholder:text-vault-text-muted focus:outline-none focus:border-vault-purple/40 resize-none h-20"
                          id="accept-message"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAcceptBounty}
                            loading={acceptLoading}
                            className="flex-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send Request
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAcceptForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Acceptance Status */}
                {myAcceptance && (
                  <div className={`p-3 rounded-xl text-sm ${
                    myAcceptance.status === "pending" ? "bg-vault-amber/10 text-vault-amber" :
                    myAcceptance.status === "approved" ? "bg-vault-green/10 text-vault-green" :
                    "bg-vault-red/10 text-vault-red"
                  }`}>
                    <div className="flex items-center gap-2 font-medium">
                      {myAcceptance.status === "pending" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {myAcceptance.status === "approved" && <CheckCircle className="w-4 h-4" />}
                      {myAcceptance.status === "rejected" && <XCircle className="w-4 h-4" />}
                      Acceptance: {myAcceptance.status === "pending" ? "Under Review" :
                        myAcceptance.status === "approved" ? "Approved — You can submit work!" :
                        "Rejected"}
                    </div>
                    {myAcceptance.creator_note && (
                      <p className="mt-1 text-xs opacity-80">Note: {myAcceptance.creator_note}</p>
                    )}
                  </div>
                )}

                {/* Submit Work (Freelancer — only if acceptance approved) */}
                {canSubmitWork && (
                  <Link href={`/bounties/${id}/submit`} className="w-full">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      id="submit-work-btn"
                      disabled={(bounty.submission_count || 0) >= bounty.max_submissions}
                    >
                      <Upload className="w-4 h-4" />
                      {(bounty.submission_count || 0) >= bounty.max_submissions ? "Max Submissions Reached" : "Submit Work"}
                    </Button>
                  </Link>
                )}

                {/* Freelancer info: need acceptance first */}
                {isFreelancer && bounty.status === "open" && !myAcceptance && !canAccept && (
                  <p className="text-xs text-vault-text-muted text-center py-2">
                    You need to accept this bounty before submitting work.
                  </p>
                )}

                {/* Dispute & Let Go (Freelancer only — requires at least 1 submission) */}
                {(bounty.status === "in_progress" || bounty.status === "submitted" || bounty.status === "expired") && user?.role === "freelancer" && submissions.length >= 1 && (
                  <div className="space-y-2 pt-2 border-t border-vault-border/50">
                    <Link href={`/bounties/${id}/dispute`} className="w-full">
                      <Button variant="danger" size="md" className="w-full" id="dispute-btn">
                        <AlertTriangle className="w-4 h-4" />
                        Raise a Dispute
                      </Button>
                    </Link>
                    <Button variant="secondary" size="md" className="w-full" onClick={handleLetGo} id="letgo-btn">
                      <Ban className="w-4 h-4" />
                      Let Go of Bounty
                    </Button>
                  </div>
                )}

                {/* Refund (Creator) */}
                {isExpired && bounty.status !== "completed" && bounty.status !== "expired" && user?.role === "creator" && (
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={handleRefund}
                    id="refund-btn"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Trigger Refund
                  </Button>
                )}
              </Card>
            </ScrollReveal>

            {/* Info */}
            <ScrollReveal direction="right" delay={0.2}>
              <Card hover={false} className="p-5">
                <h3 className="text-xs font-semibold text-vault-text-muted mb-3 uppercase tracking-wider">
                  Details
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-vault-text-muted">Status</span>
                    <span>{statusLabel(bounty.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vault-text-muted">Deadline</span>
                    <span>{new Date(bounty.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vault-text-muted">Max Subs</span>
                    <span>{bounty.max_submissions}</span>
                  </div>
                  {bounty.terms_ipfs_cid && (
                    <div className="flex justify-between">
                      <span className="text-vault-text-muted">Terms</span>
                      <a
                        href={`https://gateway.pinata.cloud/ipfs/${bounty.terms_ipfs_cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-vault-cyan hover:underline flex items-center gap-1"
                      >
                        IPFS <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {bounty.escrow_txn_id && (
                    <div className="flex justify-between">
                      <span className="text-vault-text-muted">Escrow Tx</span>
                      <span className="font-mono text-xs">
                        {truncateAddress(bounty.escrow_txn_id, 6)}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
