"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Briefcase, Code, DollarSign, Trophy, FileText, Gavel } from "lucide-react";

const CREATOR_FEATURES = [
  { icon: Briefcase, title: "Post bounties", description: "Define tasks with clear requirements and ALGO rewards" },
  { icon: DollarSign, title: "Lock funds", description: "Smart contract escrow guarantees payment availability" },
  { icon: Trophy, title: "Review & pay", description: "Approve the best submission — auto-payout to worker" },
];

const WORKER_FEATURES = [
  { icon: Code, title: "Find work", description: "Browse public bounties filtered by skills and rewards" },
  { icon: FileText, title: "Submit proof", description: "Upload work to IPFS with on-chain hash verification" },
  { icon: Gavel, title: "Build reputation", description: "Every completed bounty increases your on-chain score" },
];

export function BuildSection() {
  return (
    <section id="build" className="relative py-24 sm:py-32 section-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-section-title mb-4">
              The most trusted way to{" "}
              <span className="text-[#ef233c]">build value.</span>
            </h2>
            <p className="text-section-sub max-w-2xl mx-auto">
              Whether you&apos;re creating bounties or building solutions, BountyVault provides the tools for trustless collaboration.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Creators */}
          <ScrollReveal direction="left">
            <div className="p-8 border border-white/10 bg-zinc-900/40 rounded-xl h-full hover:border-[#ef233c]/30 transition-all duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] text-xs font-medium mb-6">
                For Creators
              </div>
              <h3 className="text-xl font-semibold font-[var(--font-heading)] mb-6 text-white">
                Post bounties &amp; get results.
              </h3>
              <div className="space-y-5">
                {CREATOR_FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-3.5">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#ef233c]/10 border border-[#ef233c]/10 flex items-center justify-center">
                      <f.icon className="w-4 h-4 text-[#ef233c]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-0.5 text-white">{f.title}</h4>
                      <p className="text-xs text-zinc-400">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Workers */}
          <ScrollReveal direction="right">
            <div className="p-8 border border-white/10 bg-zinc-900/40 rounded-xl h-full hover:border-[#ef233c]/30 transition-all duration-300">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ef233c]/10 border border-[#ef233c]/20 text-[#ef233c] text-xs font-medium mb-6">
                For Workers
              </div>
              <h3 className="text-xl font-semibold font-[var(--font-heading)] mb-6 text-white">
                Build &amp; earn ALGO.
              </h3>
              <div className="space-y-5">
                {WORKER_FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-3.5">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#ef233c]/10 border border-[#ef233c]/10 flex items-center justify-center">
                      <f.icon className="w-4 h-4 text-[#ef233c]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-0.5 text-white">{f.title}</h4>
                      <p className="text-xs text-zinc-400">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mt-16">
          <ScrollReveal delay={0}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-white mb-1">
                $0.001
              </div>
              <p className="text-xs text-zinc-500">Average tx cost</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-white mb-1">
                3.3s
              </div>
              <p className="text-xs text-zinc-500">Block finality</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="text-center col-span-2 sm:col-span-1">
              <div className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-white mb-1">
                99.9%
              </div>
              <p className="text-xs text-zinc-500">Network uptime</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
