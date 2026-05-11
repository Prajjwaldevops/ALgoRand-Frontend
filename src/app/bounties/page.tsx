"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { bountyApi, type Bounty, type BountyFilters } from "@/lib/api";
import { MOCK_BOUNTIES } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import { Search, SlidersHorizontal, Clock, Users, ArrowUpDown } from "lucide-react";

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BountyFilters>({
    page: 1,
    page_size: 12,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchBounties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bountyApi.list(filters);
      if (res.success && res.data && res.data.items.length > 0) {
        setBounties(res.data.items);
        setTotalPages(res.data.total_pages);
      } else {
        setBounties(MOCK_BOUNTIES as unknown as Bounty[]);
        setTotalPages(1);
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

  const inputClass = "px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#ef233c]/40 transition-colors placeholder:text-zinc-600";

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
        <ScrollReveal>
          <h1 className="text-section-title mb-3">
            Explore <span className="text-[#ef233c]">Bounties</span>
          </h1>
          <p className="text-section-sub max-w-xl">
            Browse open bounties from creators around the world. No authentication required.
          </p>
        </ScrollReveal>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-4 rounded-xl">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                id="bounty-search"
                type="text"
                placeholder="Search bounties..."
                className={`w-full pl-10 pr-4 ${inputClass}`}
                onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
              />
            </div>

            {/* Status Filter */}
            <select
              id="status-filter"
              className={`${inputClass} appearance-none cursor-pointer text-zinc-400`}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              defaultValue=""
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="disputed">Disputed</option>
            </select>

            {/* Sort */}
            <select
              id="sort-filter"
              className={`${inputClass} appearance-none cursor-pointer text-zinc-400`}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              defaultValue=""
            >
              <option value="">Sort by</option>
              <option value="reward_desc">Reward: High → Low</option>
              <option value="reward_asc">Reward: Low → High</option>
              <option value="deadline_asc">Deadline: Soonest</option>
            </select>

            {/* Advanced Filters Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-zinc-500 whitespace-nowrap">Min ALGO:</label>
                <input
                  id="min-reward"
                  type="number"
                  placeholder="0"
                  className={`w-full ${inputClass}`}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, min_reward: Number(e.target.value) || undefined }))
                  }
                />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs text-zinc-500 whitespace-nowrap">Max ALGO:</label>
                <input
                  id="max-reward"
                  type="number"
                  placeholder="1000"
                  className={`w-full ${inputClass}`}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, max_reward: Number(e.target.value) || undefined }))
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bounty Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-white/10 bg-zinc-900/50 p-6 rounded-xl animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/4 mb-4" />
                <div className="h-5 bg-white/5 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/5 rounded w-full mb-2" />
                <div className="h-3 bg-white/5 rounded w-2/3 mb-4" />
                <div className="flex gap-1.5 mb-4">
                  <div className="h-5 bg-white/5 rounded-full w-16" />
                  <div className="h-5 bg-white/5 rounded-full w-12" />
                </div>
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-20">
            <ArrowUpDown className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-white">No bounties found</h3>
            <p className="text-sm text-zinc-400">
              Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bounties.map((bounty, i) => (
              <ScrollReveal key={bounty.id} delay={i * 0.05}>
                <Link href={`/bounties/${bounty.id}`}>
                  <div className="border border-white/10 bg-black p-6 rounded-xl group cursor-pointer h-full flex flex-col hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge status={bounty.status} />
                      <span className="text-xl font-bold font-[var(--font-heading)] text-white">
                        {formatAlgo(bounty.reward_algo)} <span className="text-sm text-zinc-400">ALGO</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold mb-2 group-hover:text-[#ef233c] transition-colors line-clamp-2 text-white">
                      {bounty.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4 line-clamp-2 leading-relaxed flex-1">
                      {bounty.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {(bounty.tags ?? []).slice(0, 3).map((tag) => (
                        <Badge key={tag} tag={tag} />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDeadline(bounty.deadline)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {bounty.submission_count || 0}/{bounty.max_submissions}
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  filters.page === i + 1
                    ? "bg-[#ef233c] text-white"
                    : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
