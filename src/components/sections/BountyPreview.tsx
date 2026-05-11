"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Clock, Users } from "lucide-react";
import { bountyApi, type Bounty } from "@/lib/api";
import { MOCK_BOUNTIES } from "@/lib/constants";
import { formatAlgo, formatDeadline } from "@/lib/utils";

export function BountyPreview() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBounties() {
      try {
        const res = await bountyApi.list({ page_size: 4, status: "open", sort: "reward_desc" });
        if (res.success && res.data && res.data.items.length > 0) {
          setBounties(res.data.items);
        } else {
          // Fall back to mock data if backend not available
          setBounties(MOCK_BOUNTIES as unknown as Bounty[]);
        }
      } catch {
        setBounties(MOCK_BOUNTIES as unknown as Bounty[]);
      } finally {
        setLoading(false);
      }
    }
    fetchBounties();
  }, []);

  return (
    <section id="bounties-preview" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-section-title mb-2">
                What will you{" "}
                <span className="text-[#ef233c]">build?</span>
              </h2>
              <p className="text-section-sub">
                Live bounties waiting for talented builders like you.
              </p>
            </div>
            <Link href="/bounties">
              <Button variant="ghost" size="sm">
                View all bounties
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-white/10 bg-zinc-900/50 p-6 rounded-xl animate-pulse">
                <div className="h-4 bg-white/5 rounded w-3/4 mb-4" />
                <div className="h-3 bg-white/5 rounded w-full mb-2" />
                <div className="h-3 bg-white/5 rounded w-2/3 mb-6" />
                <div className="h-8 bg-white/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {bounties.map((bounty, i) => (
              <ScrollReveal key={bounty.id} delay={i * 0.1}>
                <Link href={`/bounties/${bounty.id}`}>
                  <div className="border border-white/10 bg-black p-6 rounded-xl group cursor-pointer h-full hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <Badge status={bounty.status} />
                      <span className="text-2xl font-bold font-[var(--font-heading)] text-white">
                        {formatAlgo(bounty.reward_algo)} <span className="text-sm text-zinc-400">ALGO</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-semibold mb-2 group-hover:text-[#ef233c] transition-colors line-clamp-1 text-white">
                      {bounty.title}
                    </h3>
                    <p className="text-sm text-zinc-400 mb-4 line-clamp-2 leading-relaxed">
                      {bounty.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(bounty.tags ?? []).slice(0, 3).map((tag) => (
                        <Badge key={tag} tag={tag} />
                      ))}
                    </div>

                    {/* Footer */}
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
      </div>
    </section>
  );
}
