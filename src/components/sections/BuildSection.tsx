"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Card } from "@/components/ui/Card";
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
              <span className="gradient-text">build value.</span>
            </h2>
            <p className="text-section-sub max-w-2xl mx-auto">
              Whether you&apos;re creating bounties or building solutions, BountyVault provides the tools for trustless collaboration.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Creators */}
          <ScrollReveal direction="left">
            <Card className="p-8 h-full" glow="purple" hover={false}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vault-purple/10 border border-vault-purple/20 text-vault-purple-light text-xs font-medium mb-6">
                For Creators
              </div>
              <h3 className="text-xl font-semibold font-[var(--font-heading)] mb-6">
                Post bounties &amp; get results.
              </h3>
              <div className="space-y-5">
                {CREATOR_FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-3.5">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-vault-purple/10 flex items-center justify-center">
                      <f.icon className="w-4.5 h-4.5 text-vault-purple-light" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-0.5">{f.title}</h4>
                      <p className="text-xs text-vault-text-secondary">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </ScrollReveal>

          {/* Workers */}
          <ScrollReveal direction="right">
            <Card className="p-8 h-full" glow="cyan" hover={false}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vault-cyan/10 border border-vault-cyan/20 text-vault-cyan text-xs font-medium mb-6">
                For Workers
              </div>
              <h3 className="text-xl font-semibold font-[var(--font-heading)] mb-6">
                Build &amp; earn ALGO.
              </h3>
              <div className="space-y-5">
                {WORKER_FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-3.5">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-vault-cyan/10 flex items-center justify-center">
                      <f.icon className="w-4.5 h-4.5 text-vault-cyan" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-0.5">{f.title}</h4>
                      <p className="text-xs text-vault-text-secondary">{f.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </ScrollReveal>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mt-16">
          <ScrollReveal delay={0}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] gradient-text mb-1">
                $0.001
              </div>
              <p className="text-xs text-vault-text-secondary">Average tx cost</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] gradient-text mb-1">
                3.3s
              </div>
              <p className="text-xs text-vault-text-secondary">Block finality</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="text-center col-span-2 sm:col-span-1">
              <div className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] gradient-text mb-1">
                99.9%
              </div>
              <p className="text-xs text-vault-text-secondary">Network uptime</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
