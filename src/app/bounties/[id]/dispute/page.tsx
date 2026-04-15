"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { bountyApi, type Bounty, type Submission } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  ArrowLeft,
  AlertTriangle,
  Scale,
  FileText,
  Loader2,
  CheckCircle,
  Hash,
  Clock,
  Shield,
} from "lucide-react";

export default function RaiseDisputePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bountyId = params.id as string;

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ dispute_id?: string; voting_deadline?: string } | null>(null);

  const wordCount = description.trim().split(/\s+/).filter(Boolean).length;
  const isValid = wordCount >= 300;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const bountyRes = await bountyApi.get(bountyId);
        if (bountyRes.success && bountyRes.data) setBounty(bountyRes.data);
        try {
          const subsRes = await bountyApi.submissions(bountyId);
          if (subsRes.success && subsRes.data) {
            setSubmissions(Array.isArray(subsRes.data) ? subsRes.data : []);
          }
        } catch { /* ignore */ }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [bountyId]);

  const rejectedSubmissions = submissions.filter((s) => s.status === "rejected");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError(`Description must be at least 300 words. You have ${wordCount} words.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await bountyApi.raiseDispute(bountyId, description);
      if (res.success && res.data) {
        setSuccess(true);
        setResult(res.data);
      } else {
        setError(res.error || "Failed to raise dispute");
      }
    } catch (err) {
      console.error("Dispute submission failed:", err);
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-vault-text-muted/10 rounded-xl w-1/3" />
            <div className="h-40 bg-vault-text-muted/10 rounded-2xl" />
            <div className="h-80 bg-vault-text-muted/10 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (success && result) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <ScrollReveal>
          <div className="glass-card p-10 rounded-3xl text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-vault-purple/10 flex items-center justify-center mx-auto mb-6">
              <Scale className="w-10 h-10 text-vault-purple" />
            </div>
            <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-3">
              Dispute Raised Successfully! ⚖️
            </h1>
            <p className="text-sm text-vault-text-secondary mb-4">
              Your dispute has been submitted to the DAO Court. Community members
              will now vote on this case within 48 hours.
            </p>

            <div className="glass p-4 rounded-xl mb-4 text-left">
              <p className="text-xs text-vault-text-muted mb-1">Dispute ID</p>
              <p className="text-lg font-mono font-bold text-vault-purple">
                {result.dispute_id}
              </p>
            </div>

            {result.voting_deadline && (
              <div className="glass p-4 rounded-xl mb-6 text-left">
                <p className="text-xs text-vault-text-muted mb-1">Voting Deadline</p>
                <p className="text-sm font-medium text-vault-amber">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {new Date(result.voting_deadline).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Link href="/dao">
                <Button variant="primary">
                  <Scale className="w-4 h-4" /> Go to DAO Court
                </Button>
              </Link>
              <Link href={`/bounties/${bountyId}`}>
                <Button variant="secondary">View Bounty</Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header */}
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/bounties/${bountyId}`}>
              <button className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-vault-purple/10 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-[var(--font-heading)]">
                Raise a <span className="gradient-text">Dispute</span>
              </h1>
              <p className="text-sm text-vault-text-secondary">
                Submit your case to the DAO Court for community arbitration
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Bounty Info */}
        {bounty && (
          <ScrollReveal delay={0.03}>
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-vault-text-muted mb-1">Disputed Bounty</p>
                  <h2 className="text-lg font-semibold text-vault-text">{bounty.title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xl font-mono font-bold gradient-text">
                    {bounty.reward_algo} ALGO
                  </p>
                  <p className="text-xs text-vault-text-muted">at stake</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Rejection History Summary */}
        {rejectedSubmissions.length > 0 && (
          <ScrollReveal delay={0.05}>
            <div className="glass-card p-5 rounded-2xl border border-vault-red/15">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-vault-red" />
                Rejection History ({rejectedSubmissions.length})
              </h3>
              <div className="space-y-3">
                {rejectedSubmissions.map((sub, i) => (
                  <div key={sub.id || i} className="glass p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-vault-text">
                        Submission #{sub.submission_number || i + 1}
                      </span>
                      {sub.work_hash_sha256 && (
                        <span className="text-[10px] font-mono text-vault-cyan">
                          <Hash className="w-3 h-3 inline" />
                          {sub.work_hash_sha256.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                    {sub.rejection_feedback && (
                      <p className="text-xs text-vault-red/80 italic">
                        &ldquo;{sub.rejection_feedback}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* DAO Court Rules */}
        <ScrollReveal delay={0.07}>
          <div className="glass-card p-5 rounded-2xl border border-vault-purple/15">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-vault-purple" />
              DAO Court Rules
            </h3>
            <ul className="text-xs text-vault-text-secondary space-y-2 list-disc list-inside">
              <li>Your dispute description must be <strong className="text-vault-text">at least 300 words</strong></li>
              <li>Community members will have <strong className="text-vault-amber">48 hours</strong> to vote</li>
              <li>Neither you nor the creator can vote on this dispute</li>
              <li>If <strong className="text-vault-green">freelancer wins</strong>: escrowed ALGO is released to you</li>
              <li>If <strong className="text-vault-cyan">creator wins</strong> or it&apos;s a <strong className="text-vault-text">tie</strong>: escrowed ALGO is refunded to the creator</li>
              <li>All votes and the resolution are recorded on-chain</li>
            </ul>
          </div>
        </ScrollReveal>

        {/* Dispute Description Form */}
        <ScrollReveal delay={0.1}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="glass-card p-5 rounded-2xl space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-vault-cyan" />
                Dispute Description
                <span className="text-vault-red text-xs">* (min 300 words)</span>
              </label>
              <p className="text-xs text-vault-text-secondary">
                Explain why you believe your work was wrongfully rejected. Include details about
                what you delivered, how it met the requirements, and any evidence supporting your case.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of your dispute. Explain what work you completed, how it met the bounty requirements, and why you believe the rejection was unfair. Include any relevant details, references, or evidence that supports your case..."
                rows={12}
                className="w-full bg-vault-bg/50 border border-vault-border rounded-xl px-4 py-3 text-sm
                  focus:outline-none focus:ring-2 focus:ring-vault-purple/40 focus:border-vault-purple
                  placeholder:text-vault-text-muted/50 transition-all resize-none"
                required
                id="dispute-description"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isValid ? (
                    <CheckCircle className="w-4 h-4 text-vault-green" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-vault-amber" />
                  )}
                  <span className={`text-xs font-medium ${isValid ? "text-vault-green" : "text-vault-amber"}`}>
                    {wordCount} / 300 words {isValid ? "✓" : "minimum"}
                  </span>
                </div>
                <span className="text-xs text-vault-text-muted">{description.length} characters</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="glass p-4 rounded-xl border border-vault-red/30 bg-vault-red/5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-vault-red flex-shrink-0 mt-0.5" />
                <p className="text-sm text-vault-red">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={submitting || !isValid}
              id="submit-dispute-btn"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting Dispute...
                </>
              ) : (
                <>
                  <Scale className="w-5 h-5" /> Submit Dispute to DAO Court
                </>
              )}
            </Button>
          </form>
        </ScrollReveal>
      </div>
    </div>
  );
}
