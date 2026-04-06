"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi, type TransactionLogEntry } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo } from "@/lib/utils";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Filter,
  Database,
  ArrowUpRight,
  Clock,
  Hash,
} from "lucide-react";

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  escrow_locked: { label: "Escrow Locked", color: "text-vault-purple-light" },
  bounty_accepted: { label: "Bounty Accepted", color: "text-vault-cyan" },
  work_submitted: { label: "Work Submitted", color: "text-vault-amber" },
  work_resubmitted: { label: "Work Resubmitted", color: "text-vault-amber" },
  submission_approved: { label: "Submission Approved", color: "text-vault-green" },
  submission_rejected: { label: "Submission Rejected", color: "text-vault-red" },
  freelancer_letgo: { label: "Freelancer Let Go", color: "text-vault-red" },
  dispute_initiated: { label: "Dispute Raised", color: "text-vault-magenta" },
  dao_vote_cast: { label: "DAO Vote Cast", color: "text-vault-purple-light" },
  dispute_freelancer_wins: { label: "Dispute: Freelancer Wins", color: "text-vault-green" },
  dispute_creator_wins: { label: "Dispute: Creator Wins", color: "text-vault-amber" },
  dispute_tie_creator_wins: { label: "Dispute: Tie (Creator Wins)", color: "text-vault-amber" },
  bounty_expired: { label: "Bounty Expired", color: "text-vault-text-muted" },
};

export default function TransactionLogPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.transactions();
      if (res.success) {
        setTransactions(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const uniqueEvents = [...new Set(transactions.map((t) => t.event))];

  const filtered =
    filterEvent === "all"
      ? transactions
      : transactions.filter((t) => t.event === filterEvent);

  const backPath = user?.role === "creator"
    ? "/dashboard/creator"
    : "/dashboard/freelancer";

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4 max-w-4xl mx-auto">
        <div className="h-10 bg-vault-text-muted/10 rounded-2xl w-48" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-vault-text-muted/10 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-2">
          <Link href={backPath}>
            <button className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-vault-purple/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-heading)]">
              Transaction <span className="gradient-text">Log</span>
            </h1>
            <p className="text-sm text-vault-text-secondary">
              On-chain transactions & IPFS metadata records
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter */}
      {uniqueEvents.length > 1 && (
        <ScrollReveal delay={0.05}>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-vault-text-muted" />
            <button
              onClick={() => setFilterEvent("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterEvent === "all"
                  ? "bg-vault-purple text-white"
                  : "glass text-vault-text-secondary hover:text-vault-text"
              }`}
            >
              All ({transactions.length})
            </button>
            {uniqueEvents.map((ev) => {
              const info = EVENT_LABELS[ev] || { label: ev, color: "text-vault-text-secondary" };
              const count = transactions.filter((t) => t.event === ev).length;
              return (
                <button
                  key={ev}
                  onClick={() => setFilterEvent(ev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterEvent === ev
                      ? "bg-vault-purple text-white"
                      : "glass text-vault-text-secondary hover:text-vault-text"
                  }`}
                >
                  {info.label} ({count})
                </button>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {/* Transaction List */}
      <ScrollReveal delay={0.1}>
        {filtered.length === 0 ? (
          <div className="glass-card p-10 text-center rounded-2xl">
            <Database className="w-12 h-12 text-vault-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
            <p className="text-sm text-vault-text-secondary">
              Transactions will appear here as you interact with bounties.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((txn, i) => {
              const info = EVENT_LABELS[txn.event] || { label: txn.event, color: "text-vault-text-secondary" };
              return (
                <div
                  key={txn.id}
                  className="glass-card p-5 rounded-2xl group"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Event Badge */}
                    <div className="flex-shrink-0">
                      <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded-lg font-semibold glass ${info.color}`}>
                        {info.label}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {txn.bounty_title && (
                        <p className="text-sm font-medium line-clamp-1">
                          {txn.bounty_title}
                          {txn.bounty_display_id && (
                            <span className="text-xs text-vault-text-muted ml-2">{txn.bounty_display_id}</span>
                          )}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-vault-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(txn.created_at).toLocaleString()}
                        </span>
                        {txn.actor_username && (
                          <span className="flex items-center gap-1">
                            by {txn.actor_username}
                          </span>
                        )}
                        {txn.amount_algo != null && txn.amount_algo > 0 && (
                          <span className="font-semibold text-vault-cyan">
                            {formatAlgo(txn.amount_algo)} ALGO
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {txn.txn_id && (
                        <a
                          href={`https://testnet.explorer.perawallet.app/tx/${txn.txn_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg glass text-xs text-vault-cyan hover:bg-vault-cyan/10 transition-colors"
                        >
                          <Hash className="w-3 h-3" /> Txn
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      )}
                      {txn.ipfs_metadata_cid && (
                        <a
                          href={txn.ipfs_gateway_url || `https://gateway.pinata.cloud/ipfs/${txn.ipfs_metadata_cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg glass text-xs text-vault-purple-light hover:bg-vault-purple/10 transition-colors"
                        >
                          <FileText className="w-3 h-3" /> IPFS
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollReveal>
    </div>
  );
}
