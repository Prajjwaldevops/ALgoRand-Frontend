"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { daoApi, type Dispute } from "@/lib/api";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  Scale,
  Clock,
  Trophy,
  ArrowLeft,
  ArrowRight,
  User,
  Gavel,
  CheckCircle2,
  XCircle,
  History,
  Coins,
} from "lucide-react";

interface HistoryDispute extends Dispute {
  winner?: string;
  resolved_at?: string;
  resolution_txn_id?: string;
}

export default function DAOHistoryPage() {
  const [disputes, setDisputes] = useState<HistoryDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await daoApi.getHistory();
      if (res.success && res.data) {
        setDisputes(res.data as HistoryDispute[]);
      }
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const loadDetail = async (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setDetail(null);
      return;
    }
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await daoApi.getDisputeDetail(id);
      if (res.success && res.data) {
        setDetail(res.data as unknown as Record<string, unknown>);
      }
    } catch {
      /* */
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-8">
            <Link
              href="/dao"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to DAO Court
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
                <History className="w-5 h-5 text-[#ef233c]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-[var(--font-heading)] font-bold text-white">
                Voting History
              </h1>
            </div>
            <p className="text-sm text-zinc-500">
              Past disputes resolved by DAO Court — click any dispute to view
              full details and winner
            </p>
          </div>
        </ScrollReveal>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border border-white/10 bg-zinc-900/50 rounded-xl p-6 animate-pulse"
              >
                <div className="h-5 bg-white/5 rounded w-1/3 mb-3" />
                <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
                <div className="h-4 bg-white/5 rounded w-1/4" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && disputes.length === 0 && (
          <div className="text-center py-20">
            <Scale className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No Resolved Disputes Yet
            </h2>
            <p className="text-zinc-500 text-sm">
              When disputes are finalized, they&apos;ll appear here with
              their outcomes.
            </p>
          </div>
        )}

        {/* History list */}
        {!loading && disputes.length > 0 && (
          <div className="space-y-3">
            {disputes.map((d, idx) => {
              const isExpanded = selectedId === d.id;
              const bounty = d.bounty as {
                title: string;
                reward_algo: number;
              };
              const votes = d.votes as {
                creator: number;
                freelancer: number;
                total: number;
              };
              const winner = (d as HistoryDispute).winner || "creator";
              const isCreatorWin = winner === "creator";

              return (
                <ScrollReveal key={d.id} delay={idx * 0.03}>
                  <div
                    className={`border rounded-xl transition-all duration-300 cursor-pointer ${
                      isExpanded
                        ? "border-[#ef233c]/30 bg-zinc-900/70"
                        : "border-white/10 bg-zinc-900/40 hover:border-white/20 hover:bg-zinc-900/60"
                    }`}
                    onClick={() => loadDetail(d.id)}
                  >
                    {/* Card header */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isCreatorWin
                                ? "bg-blue-500/10 border border-blue-500/20"
                                : "bg-emerald-500/10 border border-emerald-500/20"
                            }`}
                          >
                            <Trophy
                              className={`w-4 h-4 ${
                                isCreatorWin
                                  ? "text-blue-400"
                                  : "text-emerald-400"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {bounty.title}
                            </p>
                            <p className="text-xs text-zinc-600 font-mono">
                              {d.dispute_id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Winner badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                              isCreatorWin
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {isCreatorWin ? "Creator Won" : "Freelancer Won"}
                          </span>

                          <span className="text-sm font-mono font-bold text-emerald-400">
                            {bounty.reward_algo.toFixed(2)} Ⱥ
                          </span>
                        </div>
                      </div>

                      {/* Parties + votes row */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          <span className="text-zinc-400">
                            {d.creator_name}
                          </span>
                          vs
                          <span className="text-zinc-400">
                            {d.freelancer_name}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Gavel className="w-3 h-3" />
                          Votes: {votes.creator} — {votes.freelancer}
                        </span>
                        {d.resolved_at && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            Resolved {formatDate(d.resolved_at as string)}
                          </span>
                        )}
                        <ArrowRight
                          className={`w-4 h-4 ml-auto transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div
                        className="border-t border-white/[0.06] px-4 sm:px-5 py-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {detailLoading ? (
                          <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
                            <div className="w-4 h-4 border-2 border-zinc-600 border-t-[#ef233c] rounded-full animate-spin" />
                            Loading dispute details...
                          </div>
                        ) : detail ? (
                          <div className="space-y-4">
                            {/* Winner card */}
                            <div
                              className={`rounded-xl p-4 border ${
                                isCreatorWin
                                  ? "bg-blue-500/5 border-blue-500/20"
                                  : "bg-emerald-500/5 border-emerald-500/20"
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <Trophy
                                  className={`w-5 h-5 ${
                                    isCreatorWin
                                      ? "text-blue-400"
                                      : "text-emerald-400"
                                  }`}
                                />
                                <span className="text-sm font-semibold text-white">
                                  Winner:{" "}
                                  {isCreatorWin
                                    ? (detail.creator_name as string)
                                    : (detail.freelancer_name as string)}{" "}
                                  ({isCreatorWin ? "Creator" : "Freelancer"})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <Coins className="w-3.5 h-3.5" />
                                {bounty.reward_algo.toFixed(2)} ALGO released to
                                winner
                              </div>
                              {(detail.resolution_txn_id as string) && (
                                <p className="text-xs font-mono text-zinc-600 mt-1 truncate">
                                  Txn: {detail.resolution_txn_id as string}
                                </p>
                              )}
                            </div>

                            {/* Vote breakdown */}
                            <div className="grid grid-cols-2 gap-3">
                              <div
                                className={`rounded-xl p-3 border ${
                                  isCreatorWin
                                    ? "border-blue-500/20 bg-blue-500/5"
                                    : "border-white/10 bg-white/[0.02]"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {isCreatorWin ? (
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-zinc-600" />
                                  )}
                                  <span className="text-xs text-zinc-400">
                                    Creator
                                  </span>
                                </div>
                                <p className="text-xl font-bold text-white">
                                  {(detail.votes_creator as number) || votes.creator}
                                </p>
                                <p className="text-xs text-zinc-600">votes</p>
                              </div>
                              <div
                                className={`rounded-xl p-3 border ${
                                  !isCreatorWin
                                    ? "border-emerald-500/20 bg-emerald-500/5"
                                    : "border-white/10 bg-white/[0.02]"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {!isCreatorWin ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-zinc-600" />
                                  )}
                                  <span className="text-xs text-zinc-400">
                                    Freelancer
                                  </span>
                                </div>
                                <p className="text-xl font-bold text-white">
                                  {(detail.votes_freelancer as number) || votes.freelancer}
                                </p>
                                <p className="text-xs text-zinc-600">votes</p>
                              </div>
                            </div>

                            {/* Description */}
                            {(detail.freelancer_description as string) && (
                              <div>
                                <p className="text-xs text-zinc-500 mb-1 font-medium">
                                  Dispute Description
                                </p>
                                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4">
                                  {detail.freelancer_description as string}
                                </p>
                              </div>
                            )}

                            {/* View full detail link */}
                            <Link
                              href={`/dao/${d.id}`}
                              className="inline-flex items-center gap-2 text-xs text-[#ef233c] hover:text-red-300 font-medium transition-colors"
                            >
                              View Full Dispute Details
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
