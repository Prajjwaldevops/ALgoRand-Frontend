"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Wallet, Zap } from "lucide-react";

export function CTASection() {
  return (
    <section id="cta" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-vault-purple/8 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-vault-cyan/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[200px] rounded-full bg-vault-magenta/5 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8">
            <Zap className="w-3.5 h-3.5 text-vault-amber" />
            <span className="text-xs text-vault-text-secondary">Powered by Algorand</span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-section-title mb-6 max-w-2xl mx-auto">
            Join the worldwide{" "}
            <span className="gradient-text">bounty network.</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-section-sub max-w-xl mx-auto mb-10">
            Connect your wallet, explore open bounties, and start earning or posting today.
            The decentralized economy of work is here.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/bounties">
              <Button size="lg" variant="primary" id="cta-explore-btn">
                Enter BountyVault
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="secondary" id="cta-signup-btn">
                <Wallet className="w-4 h-4" />
                Create Account
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        {/* Network visualization */}
        <ScrollReveal delay={0.5}>
          <div className="mt-16 relative">
            <div className="glass-card p-8 sm:p-12 rounded-2xl gradient-border">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] text-vault-purple-light mb-1">
                    ARC4
                  </div>
                  <p className="text-xs text-vault-text-secondary">Smart Contract Standard</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] text-vault-cyan mb-1">
                    IPFS
                  </div>
                  <p className="text-xs text-vault-text-secondary">Decentralized Storage</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] text-vault-magenta mb-1">
                    PPoS
                  </div>
                  <p className="text-xs text-vault-text-secondary">Pure Proof of Stake</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
