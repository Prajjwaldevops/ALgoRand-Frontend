"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { acceptanceApi, type BountyAcceptance } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import {
  HandshakeIcon,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Search,
  ExternalLink,
} from "lucide-react";

export default function FreelancerAcceptancesPage() {
  const [acceptances, setAcceptances] = useState<BountyAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await acceptanceApi.myAcceptances();
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

  const filtered = filter === "all"
    ? acceptances
    : acceptances.filter((a) => a.status === filter);

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Loader2 className="w-4 h-4 animate-spin text-vault-amber" />;
      case "approved": return <CheckCircle className="w-4 h-4 text-vault-green" />;
      case "rejected": return <XCircle className="w-4 h-4 text-vault-red" />;
      default: return null;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-vault-amber/10 text-vault-amber";
      case "approved": return "bg-vault-green/10 text-vault-green";
      case "rejected": return "bg-vault-red/10 text-vault-red";
      default: return "bg-vault-text-muted/10 text-vault-text-muted";
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-4">
        <div className="h-10 bg-vault-text-muted/10 rounded-2xl w-1/3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-vault-text-muted/10 rounded-2xl" />
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
              My Acceptances
            </h1>
            <p className="text-sm text-vault-text-secondary mt-1">
              Track your bounty acceptance requests
            </p>
          </div>
          <Link href="/bounties">
            <Button variant="primary" size="sm">
              <Search className="w-4 h-4" /> Browse Bounties
            </Button>
          </Link>
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

      {/* Acceptances List */}
      <ScrollReveal delay={0.1}>
        {filtered.length === 0 ? (
          <div className="glass-card p-10 text-center rounded-2xl">
            <HandshakeIcon className="w-12 h-12 text-vault-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No acceptance requests</h3>
            <p className="text-sm text-vault-text-secondary mb-6">
              Browse open bounties and request to accept one to get started.
            </p>
            <Link href="/bounties">
              <Button variant="primary">
                <Search className="w-4 h-4" /> Browse Bounties
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((acc, i) => (
              <Link key={acc.id} href={`/bounties/${acc.bounty_id}`}>
                <div
                  className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 group cursor-pointer hover:border-vault-purple/20 transition-all"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusColor(acc.status)}`}>
                      {statusIcon(acc.status)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold group-hover:text-vault-purple-light transition-colors line-clamp-1">
                      {acc.bounty_title || "Untitled Bounty"}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-vault-text-muted">
                      <span>by {acc.creator_username || "Creator"}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {acc.bounty_deadline ? formatDeadline(acc.bounty_deadline) : "—"}
                      </span>
                      <span className={`uppercase tracking-wider px-2 py-0.5 rounded font-medium ${statusColor(acc.status)}`}>
                        {acc.status}
                      </span>
                    </div>
                    {acc.creator_note && (
                      <p className="text-xs text-vault-text-secondary mt-1 italic line-clamp-1">
                        &quot;{acc.creator_note}&quot;
                      </p>
                    )}
                  </div>

                  {/* Reward */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold gradient-text">
                      {acc.bounty_reward ? formatAlgo(acc.bounty_reward) : "—"} ALGO
                    </span>
                    <p className="text-xs text-vault-text-muted mt-0.5 flex items-center gap-1 justify-end">
                      <ExternalLink className="w-3 h-3" /> View
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ScrollReveal>
    </div>
  );
}
