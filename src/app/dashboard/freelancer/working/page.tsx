"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { dashboardApi, bountyApi, type WorkingBounty } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import {
  Zap,
  Clock,
  ArrowLeft,
  Upload,
  RefreshCw,
  ShieldAlert,
  HandCoins,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Timer,
  Hash,
  MessageSquare,
} from "lucide-react";

function DeadlineTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
      setIsExpired(false);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${
      isExpired ? "text-vault-red" : "text-vault-cyan"
    }`}>
      <Timer className="w-3.5 h-3.5" />
      <span>{timeLeft}</span>
    </div>
  );
}

export default function WorkingBountiesPage() {
  const [bounties, setBounties] = useState<WorkingBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [letGoConfirm, setLetGoConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.workingBounties();
      if (res.success && res.data) setBounties(res.data);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLetGo = async (bountyId: string) => {
    setActionLoading(bountyId);
    try {
      const res = await bountyApi.letGo(bountyId);
      if (res.success) {
        fetchData();
        setLetGoConfirm(null);
      }
    } catch {
      /* */
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4 max-w-4xl mx-auto">
        <div className="h-10 bg-vault-text-muted/10 rounded-2xl w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-vault-text-muted/10 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard/freelancer">
            <button className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-vault-purple/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-heading)]">
              Working <span className="gradient-text">Bounties</span>
            </h1>
            <p className="text-sm text-vault-text-secondary">
              Bounties assigned to you — submit work and track progress
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Bounty List */}
      {bounties.length === 0 ? (
        <ScrollReveal delay={0.05}>
          <div className="glass-card p-10 text-center rounded-2xl">
            <Zap className="w-12 h-12 text-vault-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assigned bounties</h3>
            <p className="text-sm text-vault-text-secondary mb-6">
              Apply to bounties and get accepted by creators to start working.
            </p>
            <Link href="/bounties">
              <Button variant="primary">Browse Bounties</Button>
            </Link>
          </div>
        </ScrollReveal>
      ) : (
        <div className="space-y-4">
          {bounties.map((bounty, i) => (
            <ScrollReveal key={bounty.id} delay={i * 0.05}>
              <div className="glass-card p-5 rounded-2xl">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge status={bounty.status} />
                      {/* Submission status */}
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold ${
                        bounty.submission_status === "approved" ? "bg-vault-green/10 text-vault-green"
                          : bounty.submission_status === "rejected" ? "bg-vault-red/10 text-vault-red"
                          : bounty.submission_status === "pending" ? "bg-vault-amber/10 text-vault-amber"
                          : "bg-vault-purple/10 text-vault-purple-light"
                      }`}>
                        {bounty.submission_status === "none"
                          ? "Work: Pending"
                          : `Submission: ${bounty.submission_status}`}
                      </span>
                    </div>
                    <Link href={`/bounties/${bounty.id}`}>
                      <h3 className="text-sm font-semibold hover:text-vault-purple-light transition-colors line-clamp-1 cursor-pointer">
                        {bounty.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-vault-text-muted mt-0.5">
                      by {bounty.creator_username}
                    </p>
                  </div>
                  <span className="text-lg font-bold gradient-text flex-shrink-0 ml-3">
                    {formatAlgo(bounty.reward_algo)} <span className="text-xs">ALGO</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-vault-text-secondary line-clamp-2 mb-3">
                  {bounty.description}
                </p>

                {/* Rejection Feedback — Enhanced */}
                {bounty.rejection_feedback && bounty.submission_status === "rejected" && (
                  <div className="glass p-4 rounded-xl mb-3 border border-vault-red/20 bg-vault-red/5">
                    <p className="text-xs font-semibold text-vault-red flex items-center gap-1.5 mb-2">
                      <XCircle className="w-4 h-4" /> Rejection Feedback
                    </p>
                    <div className="bg-vault-bg/30 rounded-lg p-3 mb-2">
                      <p className="text-xs text-vault-text-secondary whitespace-pre-wrap leading-relaxed">
                        {bounty.rejection_feedback}
                      </p>
                    </div>
                    <p className="text-[10px] text-vault-text-muted flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Review the feedback carefully and address all points before resubmitting.
                    </p>
                  </div>
                )}

                {/* Stats row with deadline timer + submission counter */}
                <div className="flex items-center gap-4 text-xs text-vault-text-muted mb-4 pt-3 border-t border-vault-border">
                  {/* Live Deadline Timer */}
                  <DeadlineTimer deadline={bounty.deadline} />

                  {/* Submission Counter */}
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-vault-purple-light" />
                    <span className="font-medium">
                      {bounty.submission_count || 0} / {bounty.max_submissions}
                      <span className="text-vault-text-muted ml-1">submissions</span>
                    </span>
                  </div>

                  {/* Slots remaining */}
                  <span className={`font-medium ${
                    bounty.submissions_remaining <= 1 ? "text-vault-red" : "text-vault-text-muted"
                  }`}>
                    {bounty.submissions_remaining} slot{bounty.submissions_remaining !== 1 ? "s" : ""} left
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Submit Work */}
                  {bounty.can_submit && (
                    <Link href={`/bounties/${bounty.id}/submit`}>
                      <Button variant="primary" size="sm">
                        <Upload className="w-4 h-4" />
                        {bounty.can_resubmit ? "Resubmit Work" : "Submit Work"}
                      </Button>
                    </Link>
                  )}

                  {/* Pending submission */}
                  {bounty.submission_status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs text-vault-amber">
                      <Loader2 className="w-3 h-3 animate-spin" /> Awaiting Review
                    </span>
                  )}

                  {/* Approved */}
                  {bounty.submission_status === "approved" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs text-vault-green">
                      <CheckCircle className="w-3 h-3" /> Approved 🎉
                    </span>
                  )}

                  {/* Let Go (only if has_submitted and expired) */}
                  {bounty.can_let_go && (
                    <>
                      {letGoConfirm === bounty.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-vault-red">⚠️ This will reset ALL your ratings to 0</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleLetGo(bounty.id)}
                            disabled={actionLoading === bounty.id}
                          >
                            {actionLoading === bounty.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Confirm Let Go"
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setLetGoConfirm(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setLetGoConfirm(bounty.id)}
                        >
                          <HandCoins className="w-4 h-4" /> Let Go
                        </Button>
                      )}
                    </>
                  )}

                  {/* Raise Dispute (only if has_submitted and expired) */}
                  {bounty.can_dispute && (
                    <Link href={`/bounties/${bounty.id}`}>
                      <Button variant="secondary" size="sm">
                        <ShieldAlert className="w-4 h-4" /> Raise Dispute
                      </Button>
                    </Link>
                  )}

                  {/* View Bounty */}
                  <Link href={`/bounties/${bounty.id}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" /> View
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
