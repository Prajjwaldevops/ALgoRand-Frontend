"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { bountyApi, type Bounty, type BountyFilters } from "@/lib/api";
import { MOCK_BOUNTIES } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  Clock,
  Users,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
  Zap,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BountyFilters>({
    page: 1,
    page_size: 12,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  const fetchBounties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bountyApi.list(filters);
      if (res.success && res.data && res.data.items.length > 0) {
        setBounties(res.data.items);
        setTotalPages(res.data.total_pages);
        setTotalCount(res.data.total_count);
      } else {
        setBounties(MOCK_BOUNTIES as unknown as Bounty[]);
        setTotalPages(1);
        setTotalCount(MOCK_BOUNTIES.length);
      }
    } catch {
      setBounties(MOCK_BOUNTIES as unknown as Bounty[]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBounties();
  }, [fetchBounties]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, tag: searchValue, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const clearFilters = () => {
    setFilters({ page: 1, page_size: 12 });
    setSearchValue("");
    setShowFilters(false);
  };

  const hasActiveFilters = !!(filters.status || filters.tag || filters.min_reward || filters.max_reward || filters.sort);

  const statusOptions = [
    { value: "", label: "All Status", icon: "○" },
    { value: "open", label: "Open", icon: "●" },
    { value: "in_progress", label: "In Progress", icon: "◐" },
    { value: "completed", label: "Completed", icon: "●" },
    { value: "disputed", label: "Disputed", icon: "!" },
  ];

  const inputClass =
    "px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-[#ef233c]/50 focus:bg-white/[0.05] transition-all duration-300 placeholder:text-zinc-600";
  const selectClass =
    "px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-zinc-400 focus:outline-none focus:border-[#ef233c]/50 focus:bg-white/[0.05] transition-all duration-300 appearance-none cursor-pointer";

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#ef233c]/[0.07] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[200px] h-[200px] bg-[#ef233c]/[0.04] rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10 relative">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#ef233c]" />
                <span className="text-xs font-medium text-[#ef233c]">
                  {totalCount} bounties available
                </span>
              </div>
            </div>

            <h1 className="text-display mb-4">
              Explore{" "}
              <span className="gradient-text">Bounties</span>
            </h1>
            <p className="text-hero-sub max-w-xl mb-2">
              Discover open opportunities from creators worldwide.
              Find your next challenge and earn ALGO.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <ScrollReveal delay={0.05}>
          <div className="glass rounded-2xl p-4 relative overflow-hidden">
            {/* Subtle shimmer on top */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#ef233c]/30 to-transparent" />

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#ef233c]/70 transition-colors" />
                <input
                  id="bounty-search"
                  type="text"
                  placeholder="Search bounties by keyword or tag..."
                  className={`w-full pl-10 pr-4 ${inputClass}`}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  id="status-filter"
                  className={selectClass}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
                  }
                  value={filters.status || ""}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 rotate-90 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  id="sort-filter"
                  className={selectClass}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))
                  }
                  value={filters.sort || ""}
                >
                  <option value="">Newest First</option>
                  <option value="reward_desc">Reward: High → Low</option>
                  <option value="reward_asc">Reward: Low → High</option>
                  <option value="deadline_asc">Deadline: Soonest</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 rotate-90 pointer-events-none" />
              </div>

              {/* Advanced Filters Toggle + Clear */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 ${showFilters ? "text-[#ef233c]" : ""}`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">More</span>
                </Button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters — Reward Range */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden transition-all duration-300 ${
                showFilters ? "mt-3 pt-3 border-t border-white/[0.06] max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <label className="text-xs text-zinc-500 whitespace-nowrap font-medium">
                  Min ALGO
                </label>
                <input
                  id="min-reward"
                  type="number"
                  placeholder="0"
                  className={`w-full ${inputClass}`}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      min_reward: Number(e.target.value) || undefined,
                      page: 1,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2.5">
                <label className="text-xs text-zinc-500 whitespace-nowrap font-medium">
                  Max ALGO
                </label>
                <input
                  id="max-reward"
                  type="number"
                  placeholder="10,000"
                  className={`w-full ${inputClass}`}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      max_reward: Number(e.target.value) || undefined,
                      page: 1,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Bounty Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {loading ? (
          /* Skeleton Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex justify-between mb-4">
                  <div className="h-5 bg-white/[0.06] rounded-full w-20" />
                  <div className="h-6 bg-white/[0.06] rounded w-24" />
                </div>
                <div className="h-5 bg-white/[0.06] rounded w-3/4 mb-3" />
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-white/[0.04] rounded w-full" />
                  <div className="h-3 bg-white/[0.04] rounded w-2/3" />
                </div>
                <div className="flex gap-1.5 mb-4">
                  <div className="h-5 bg-white/[0.06] rounded-full w-16" />
                  <div className="h-5 bg-white/[0.06] rounded-full w-14" />
                </div>
                <div className="h-px bg-white/5 my-3" />
                <div className="flex justify-between">
                  <div className="h-4 bg-white/[0.04] rounded w-24" />
                  <div className="h-4 bg-white/[0.04] rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : bounties.length === 0 ? (
          /* Empty State */
          <ScrollReveal>
            <div className="text-center py-24">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl glass flex items-center justify-center">
                <ArrowUpDown className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white font-[var(--font-heading)]">
                No bounties found
              </h3>
              <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
                Try adjusting your filters or check back later for new
                opportunities.
              </p>
              {hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </ScrollReveal>
        ) : (
          /* Bounty Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bounties.map((bounty, i) => (
              <ScrollReveal key={bounty.id} delay={i * 0.04}>
                <Link href={`/bounties/${bounty.id}`}>
                  <div className="group relative glass-card p-0 overflow-hidden h-full flex flex-col">
                    {/* Top accent line */}
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#ef233c]/0 to-transparent group-hover:via-[#ef233c]/40 transition-all duration-500" />

                    <div className="p-5 flex flex-col h-full">
                      {/* Header: Status + Reward */}
                      <div className="flex items-start justify-between mb-3">
                        <Badge status={bounty.status} />
                        <div className="text-right">
                          <span className="text-xl font-bold font-[var(--font-heading)] text-white group-hover:text-[#ef233c] transition-colors duration-300">
                            {formatAlgo(bounty.reward_algo)}
                          </span>
                          <span className="text-xs text-zinc-500 ml-1">
                            ALGO
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold mb-2 text-white group-hover:text-[#ef233c] transition-colors duration-300 line-clamp-2 leading-snug">
                        {bounty.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-zinc-500 mb-4 line-clamp-2 leading-relaxed flex-1">
                        {bounty.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(bounty.tags ?? []).slice(0, 3).map((tag) => (
                          <Badge key={tag} tag={tag} />
                        ))}
                        {(bounty.tags ?? []).length > 3 && (
                          <span className="text-[10px] text-zinc-600 px-2 py-0.5">
                            +{(bounty.tags ?? []).length - 3}
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-zinc-600 pt-3 border-t border-white/[0.06]">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDeadline(bounty.deadline)}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {bounty.submission_count || 0}/
                            {bounty.max_submissions}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom hover glow */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#ef233c]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {/* Previous */}
            <button
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  page: Math.max(1, (f.page || 1) - 1),
                }))
              }
              disabled={filters.page === 1}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-300 ${
                  filters.page === i + 1
                    ? "bg-[#ef233c] text-white shadow-lg shadow-[#ef233c]/20"
                    : "glass text-zinc-500 hover:text-white hover:border-white/20"
                }`}
              >
                {i + 1}
              </button>
            ))}

            {/* Next */}
            <button
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  page: Math.min(totalPages, (f.page || 1) + 1),
                }))
              }
              disabled={filters.page === totalPages}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
