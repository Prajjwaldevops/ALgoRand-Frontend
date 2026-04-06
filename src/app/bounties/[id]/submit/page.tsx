"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { bountyApi, type Bounty } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  Upload,
  LinkIcon,
  FileText,
  Shield,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Wallet,
  Timer,
  Hash,
} from "lucide-react";

export default function SubmitWorkPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bountyId = params.id as string;

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [bountyLoading, setBountyLoading] = useState(true);
  const [megaLink, setMegaLink] = useState("");
  const [description, setDescription] = useState("");
  const [encryptionKeyFile, setEncryptionKeyFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ submission_id?: string; work_hash?: string; submission_number?: number } | null>(null);
  const [submissionCount, setSubmissionCount] = useState(0);

  const isValidMegaLink = megaLink.startsWith("https://mega.nz/") && megaLink.length > 20;
  const hasWallet = !!user?.wallet_address;

  // Fetch bounty details for submissions_remaining + submission count
  useEffect(() => {
    async function loadBounty() {
      setBountyLoading(true);
      try {
        const res = await bountyApi.get(bountyId);
        if (res.success && res.data) {
          setBounty(res.data);
        }
        // Get submission count for this freelancer
        try {
          const subsRes = await bountyApi.submissions(bountyId);
          if (subsRes.success && subsRes.data) {
            const subs = Array.isArray(subsRes.data) ? subsRes.data : [];
            setSubmissionCount(subs.length);
          }
        } catch { /* ignore */ }
      } catch { /* ignore */ } finally {
        setBountyLoading(false);
      }
    }
    loadBounty();
  }, [bountyId]);

  const subsRemaining = bounty ? (bounty.max_submissions - (bounty.submission_count || 0)) : 0;
  const isResubmission = submissionCount > 0;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setError("Only .txt files are allowed for the encryption key");
      return;
    }
    if (file.size > 1024) {
      setError("Encryption key file must be under 1KB");
      return;
    }
    setError(null);
    setEncryptionKeyFile(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasWallet) {
      setError("You must connect your Algorand wallet before submitting work.");
      return;
    }
    if (!megaLink.trim()) {
      setError("Mega.nz link is required");
      return;
    }
    if (!isValidMegaLink) {
      setError("Invalid mega.nz link — must start with https://mega.nz/");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (!encryptionKeyFile) {
      setError("Encryption key .txt file is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await bountyApi.submit(bountyId, megaLink, description, encryptionKeyFile);
      console.log("[SubmitWork] API response:", res);
      if (res.success && res.data) {
        setSuccess(true);
        setResult(res.data as { submission_id?: string; work_hash?: string; submission_number?: number });
      } else {
        console.error("[SubmitWork] Submission failed:", res.error);
        setError(res.error || "Submission failed");
      }
    } catch (err) {
      console.error("[SubmitWork] Network error:", err);
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (bountyLoading) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-vault-text-muted/10 rounded-xl w-1/3" />
          <div className="h-32 bg-vault-text-muted/10 rounded-2xl" />
          <div className="h-64 bg-vault-text-muted/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <ScrollReveal>
          <div className="glass-card p-10 rounded-3xl text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-vault-green/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-vault-green" />
            </div>
            <h1 className="text-2xl font-bold font-[var(--font-heading)] mb-3">
              Work Submitted Successfully! 🎉
            </h1>
            <p className="text-sm text-vault-text-secondary mb-6">
              Your submission has been recorded and is now pending review by the creator.
            </p>

            {result?.work_hash && (
              <div className="glass p-4 rounded-xl mb-6 text-left">
                <p className="text-xs text-vault-text-muted mb-1">On-chain Work Hash</p>
                <p className="text-xs font-mono text-vault-cyan break-all">{result.work_hash}</p>
              </div>
            )}

            {result?.submission_number && (
              <div className="glass p-4 rounded-xl mb-6 text-left">
                <p className="text-xs text-vault-text-muted mb-1">Submission #</p>
                <p className="text-sm font-bold text-vault-purple-light">{result.submission_number}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Link href={`/bounties/${bountyId}`}>
                <Button variant="primary">View Bounty</Button>
              </Link>
              <Link href="/dashboard/freelancer/working">
                <Button variant="secondary">Working Bounties</Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
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
              {isResubmission ? "Resubmit" : "Submit"} <span className="gradient-text">Work</span>
            </h1>
            <p className="text-sm text-vault-text-secondary">
              Upload your work files to mega.nz and provide the link below
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Submission Counter + Bounty Info */}
      <ScrollReveal delay={0.03}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="glass-card p-4 rounded-2xl text-center">
            <Hash className="w-5 h-5 text-vault-purple-light mx-auto mb-2" />
            <p className="text-lg font-bold">{submissionCount}</p>
            <p className="text-xs text-vault-text-muted">Submissions Made</p>
          </div>
          <div className="glass-card p-4 rounded-2xl text-center">
            <Timer className="w-5 h-5 text-vault-cyan mx-auto mb-2" />
            <p className={`text-lg font-bold ${subsRemaining <= 1 ? "text-vault-red" : "text-vault-green"}`}>{subsRemaining}</p>
            <p className="text-xs text-vault-text-muted">Submissions Left</p>
          </div>
          {bounty && (
            <div className="glass-card p-4 rounded-2xl text-center col-span-2 sm:col-span-1">
              <Wallet className="w-5 h-5 text-vault-amber mx-auto mb-2" />
              <p className="text-lg font-bold gradient-text">{bounty.reward_algo} ALGO</p>
              <p className="text-xs text-vault-text-muted">Reward</p>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Wallet Check */}
      {!hasWallet && (
        <ScrollReveal delay={0.04}>
          <div className="glass-card p-5 rounded-2xl border border-vault-amber/30 bg-vault-amber/5">
            <div className="flex items-start gap-3">
              <Wallet className="w-6 h-6 text-vault-amber flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-vault-amber mb-1">
                  Wallet Required
                </h3>
                <p className="text-xs text-vault-text-secondary mb-3">
                  You must connect your Algorand wallet before submitting work. Your wallet address
                  will be stored with your submission so the creator can send payment directly to you.
                </p>
                <Link href="/profile">
                  <Button variant="primary" size="sm">
                    <Wallet className="w-4 h-4" /> Connect Wallet
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Resubmission Notice */}
      {isResubmission && (
        <ScrollReveal delay={0.04}>
          <div className="glass-card p-5 rounded-2xl border border-vault-purple/20 bg-vault-purple/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-vault-purple-light flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-vault-purple-light mb-1">
                  Resubmission
                </h3>
                <p className="text-xs text-vault-text-secondary">
                  This is a resubmission. You have <strong className="text-vault-text">{subsRemaining}</strong> submission
                  slot{subsRemaining !== 1 ? "s" : ""} remaining. Make sure to address all feedback from your previous submission.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Instructions */}
      <ScrollReveal delay={0.05}>
        <div className="glass-card p-5 rounded-2xl border border-vault-cyan/20">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-vault-cyan" /> Submission Requirements
          </h3>
          <ol className="text-xs text-vault-text-secondary space-y-2 list-decimal list-inside">
            <li>Upload your completed work files to <span className="text-vault-cyan font-medium">mega.nz</span> (encrypted)</li>
            <li>Copy the <strong>mega.nz file link</strong> and paste it below</li>
            <li>Create a <span className="text-vault-amber font-medium">.txt file</span> containing the decryption key/password</li>
            <li>Upload the encryption key file below — it will be securely stored and shared only with the creator</li>
            <li>Write a clear description of the work you&apos;ve completed</li>
          </ol>
        </div>
      </ScrollReveal>

      {/* Form */}
      <ScrollReveal delay={0.1}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mega.nz Link */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-vault-purple-light" />
              Mega.nz Download Link
              <span className="text-vault-red text-xs">*</span>
            </label>
            <input
              type="url"
              value={megaLink}
              onChange={(e) => setMegaLink(e.target.value)}
              placeholder="https://mega.nz/file/..."
              className="w-full bg-vault-bg/50 border border-vault-border rounded-xl px-4 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-vault-purple/40 focus:border-vault-purple
                placeholder:text-vault-text-muted/50 transition-all"
              required
              disabled={!hasWallet}
            />
            {megaLink && !isValidMegaLink && (
              <p className="text-xs text-vault-amber flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Must be a valid mega.nz link
              </p>
            )}
            {isValidMegaLink && (
              <p className="text-xs text-vault-green flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Valid mega.nz link
              </p>
            )}
          </div>

          {/* Encryption Key File */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-vault-amber" />
              Encryption Key File (.txt)
              <span className="text-vault-red text-xs">*</span>
            </label>
            <p className="text-xs text-vault-text-secondary">
              A .txt file containing the password/key to decrypt the mega.nz file
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="encryption-key-upload"
                disabled={!hasWallet}
              />
              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                encryptionKeyFile
                  ? "border-vault-green/40 bg-vault-green/5"
                  : "border-vault-border hover:border-vault-purple/40"
              }`}>
                {encryptionKeyFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-vault-green" />
                    <span className="text-sm font-medium text-vault-green">{encryptionKeyFile.name}</span>
                    <span className="text-xs text-vault-text-muted">({encryptionKeyFile.size} bytes)</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-vault-text-muted mx-auto mb-2" />
                    <p className="text-sm text-vault-text-secondary">
                      Drop your encryption key .txt file here or <span className="text-vault-purple-light">browse</span>
                    </p>
                    <p className="text-xs text-vault-text-muted mt-1">Max 1KB · .txt only</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-vault-cyan" />
              Work Description
              <span className="text-vault-red text-xs">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the work you've completed, any special instructions for the creator, tools/technologies used..."
              rows={5}
              className="w-full bg-vault-bg/50 border border-vault-border rounded-xl px-4 py-3 text-sm
                focus:outline-none focus:ring-2 focus:ring-vault-purple/40 focus:border-vault-purple
                placeholder:text-vault-text-muted/50 transition-all resize-none"
              required
              disabled={!hasWallet}
            />
            <p className="text-xs text-vault-text-muted text-right">{description.length} characters</p>
          </div>

          {/* Wallet Info */}
          {hasWallet && (
            <div className="glass p-4 rounded-xl flex items-center gap-3">
              <Wallet className="w-5 h-5 text-vault-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-vault-text-muted">Payout Wallet</p>
                <p className="text-xs font-mono text-vault-cyan truncate">{user?.wallet_address}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-vault-green flex-shrink-0" />
            </div>
          )}

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
            disabled={submitting || !isValidMegaLink || !encryptionKeyFile || !description.trim() || !hasWallet}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" /> {isResubmission ? "Resubmit Work" : "Submit Work"}
              </>
            )}
          </Button>
        </form>
      </ScrollReveal>
    </div>
  );
}
