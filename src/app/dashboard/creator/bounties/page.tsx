"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { dashboardApi, type DashboardBounty } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { formatAlgo, formatDeadline } from "@/lib/utils";
import { Briefcase, Plus, Clock, BarChart3, Search, Filter } from "lucide-react";

export default function CreatorBountiesPage() {
  const [bounties, setBounties] = useState<DashboardBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBounties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.myBounties();
      if (res.success && res.data) setBounties(res.data);
    } catch { /* use defaults */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBounties(); }, [fetchBounties]);

  const filteredBounties = bounties.filter((b) => {
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statuses = ["all", ...new Set(bounties.map((b) => b.status))];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-[var(--font-heading)]">My Bounties</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {bounties.length} bounties created
            </p>
          </div>
          <Link href="/create">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" /> Create Bounty
            </Button>
          </Link>
        </div>
      </ScrollReveal>

      {/* Filters */}
      <ScrollReveal delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search bounties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#ef233c] transition-colors"
            />
          </div>
          <div className="flex gap-1 glass p-1 rounded-xl">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  statusFilter === status
                    ? "bg-[#ef233c] text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {status === "all" ? "All" : status.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Bounties List */}
      <ScrollReveal delay={0.15}>
        {filteredBounties.length === 0 ? (
          <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-10 text-center rounded-2xl">
            <Filter className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bounties found</h3>
            <p className="text-sm text-zinc-400">
              {bounties.length === 0
                ? "Create your first bounty to get started!"
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBounties.map((bounty, i) => (
              <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                <div
                  className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 group cursor-pointer hover:border-[#ef233c]/20 transition-all"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge status={bounty.status} />
                      {bounty.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} tag={tag} />
                      ))}
                    </div>
                    <h3 className="text-sm font-semibold group-hover:text-[#ef233c] transition-colors line-clamp-1">
                      {bounty.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {bounty.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-sm font-bold gradient-text">{formatAlgo(bounty.reward_algo)} ALGO</div>
                      <p className="text-[10px] text-zinc-500">Reward</p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5 text-[#ef233c]" />
                        {bounty.submission_count}/{bounty.max_submissions}
                      </div>
                      <p className="text-[10px] text-zinc-500">Submissions</p>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDeadline(bounty.deadline)}
                      </div>
                      <p className="text-[10px] text-zinc-500">Deadline</p>
                    </div>
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
