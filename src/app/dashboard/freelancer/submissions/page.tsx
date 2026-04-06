"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { dashboardApi, type DashboardSubmission } from "@/lib/api";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

type FilterStatus = "all" | "pending" | "under_review" | "approved" | "rejected";

const STATUS_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }
> = {
  pending: { icon: Clock, color: "text-vault-amber", bg: "bg-vault-amber/10", label: "Pending Review" },
  under_review: { icon: Eye, color: "text-vault-cyan", bg: "bg-vault-cyan/10", label: "Under Review" },
  approved: { icon: CheckCircle, color: "text-vault-green", bg: "bg-vault-green/10", label: "Approved ✓" },
  rejected: { icon: XCircle, color: "text-vault-red", bg: "bg-vault-red/10", label: "Rejected" },
};

export default function FreelancerSubmissionsPage() {
  const [submissions, setSubmissions] = useState<DashboardSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.mySubmissions();
      if (res.success && res.data) setSubmissions(res.data);
    } catch {
      /* defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered =
    filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  const counts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    under_review: submissions.filter((s) => s.status === "under_review").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-vault-text-muted/10 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-heading)] flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-vault-green" /> My Submissions
            </h1>
            <p className="text-sm text-vault-text-secondary mt-1">
              Track all your bounty submissions and their review status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-vault-green/10 border border-vault-green/20">
              <CheckCircle className="w-4 h-4 text-vault-green" />
              <span className="text-sm text-vault-green font-medium">
                {counts.approved} approved
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-vault-card border border-vault-border">
              <FileCheck className="w-4 h-4 text-vault-purple" />
              <span className="text-sm text-vault-text-secondary">
                {submissions.length} total
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Status Summary Cards */}
      {submissions.length > 0 && (
        <ScrollReveal delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["pending", "under_review", "approved", "rejected"] as const).map((status) => {
              const cfg = STATUS_CONFIG[status];
              const StatusIcon = cfg.icon;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(filter === status ? "all" : status)}
                  className={`glass-card rounded-xl p-4 text-center transition-all duration-200 hover:scale-[1.02] ${
                    filter === status ? "ring-2 ring-vault-purple/50 border-vault-purple/30" : ""
                  }`}
                >
                  <StatusIcon className={`w-5 h-5 mx-auto mb-2 ${cfg.color}`} />
                  <p className={`text-2xl font-heading font-bold ${cfg.color}`}>
                    {counts[status]}
                  </p>
                  <p className="text-xs text-vault-text-muted mt-0.5">{cfg.label}</p>
                </button>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {/* Filter Tabs */}
      <ScrollReveal delay={0.1}>
        <div className="flex gap-1 glass p-1 rounded-xl w-fit">
          {(
            [
              { key: "all" as FilterStatus, label: "All" },
              { key: "pending" as FilterStatus, label: "Pending" },
              { key: "under_review" as FilterStatus, label: "In Review" },
              { key: "approved" as FilterStatus, label: "Approved" },
              { key: "rejected" as FilterStatus, label: "Rejected" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key
                  ? "bg-vault-purple text-white shadow-lg shadow-vault-purple/20"
                  : "text-vault-text-secondary hover:text-vault-text"
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                    filter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-vault-purple/10 text-vault-purple-light"
                  }`}
                >
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Submissions List */}
      {filtered.length === 0 ? (
        <ScrollReveal delay={0.15}>
          <div className="glass-card p-10 text-center rounded-2xl">
            <FileCheck className="w-12 h-12 text-vault-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {submissions.length === 0
                ? "No submissions yet"
                : `No ${filter.replace("_", " ")} submissions`}
            </h3>
            <p className="text-sm text-vault-text-secondary mb-6">
              {submissions.length === 0
                ? "Browse bounties and submit your work to earn ALGO."
                : "Try a different filter to see your submissions."}
            </p>
            {submissions.length === 0 && (
              <Link href="/bounties">
                <Button variant="primary">
                  <Search className="w-4 h-4" /> Browse Bounties
                </Button>
              </Link>
            )}
          </div>
        </ScrollReveal>
      ) : (
        <ScrollReveal delay={0.15}>
          <div className="space-y-3">
            {filtered.map((sub, i) => {
              const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <Link key={sub.id} href={`/bounties/${sub.bounty_id}`}>
                  <div
                    className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 group cursor-pointer hover:border-vault-border-hover transition-all duration-300"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg}`}
                      >
                        <StatusIcon className={`w-6 h-6 ${cfg.color}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold group-hover:text-vault-purple-light transition-colors line-clamp-1">
                        {sub.bounty_title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium ${cfg.bg} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-xs text-vault-text-muted">
                          Submitted{" "}
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-vault-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDeadline(sub.bounty_deadline)}
                        </span>
                      </div>

                      {/* Rejection Feedback */}
                      {sub.status === "rejected" && sub.feedback && (
                        <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-vault-red/5 border border-vault-red/10">
                          <AlertTriangle className="w-3.5 h-3.5 text-vault-red mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-vault-red/80 line-clamp-2">
                            {sub.feedback}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Reward + Action */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-bold gradient-text">
                        {formatAlgo(sub.bounty_reward)} ALGO
                      </span>
                      <p className="text-xs text-vault-text-muted mt-0.5 flex items-center gap-1 justify-end group-hover:text-vault-purple-light transition-colors">
                        <ExternalLink className="w-3 h-3" /> View Bounty
                      </p>
                      {sub.status === "rejected" && (
                        <p className="text-[10px] text-vault-amber flex items-center gap-1 justify-end mt-1">
                          <RotateCcw className="w-3 h-3" /> Can resubmit
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
