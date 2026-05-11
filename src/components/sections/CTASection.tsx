"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ArrowRight, Wallet, Zap } from "lucide-react";

export function CTASection() {
  return (
    <section id="cta" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#ef233c]/5 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-[#ef233c]/3 blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative">
        <ScrollReveal>
          <h2 className="text-5xl md:text-7xl font-bold font-[var(--font-heading)] mb-8 tracking-tighter">
            Ready to <span className="text-[#ef233c]">Build?</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="text-xl text-zinc-400 mb-12">
            Connect your wallet, explore open bounties, and start earning or posting today.
            The decentralized economy of work is here.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/bounties">
              <button id="cta-explore-btn" className="bg-[#ef233c] hover:bg-red-700 text-white font-bold rounded-full px-8 py-4 transition-all flex items-center gap-2">
                Enter BountyVault
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/auth">
              <button id="cta-signup-btn" className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-medium hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Create Account
              </button>
            </Link>
          </div>
        </ScrollReveal>

        {/* Network visualization */}
        <ScrollReveal delay={0.4}>
          <div className="mt-16 relative">
            <div className="border border-white/10 bg-zinc-900/40 backdrop-blur-sm p-8 sm:p-12 rounded-2xl">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] text-[#ef233c] mb-1">
                    ARC4
                  </div>
                  <p className="text-xs text-zinc-500">Smart Contract Standard</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] text-[#ef233c] mb-1">
                    IPFS
                  </div>
                  <p className="text-xs text-zinc-500">Decentralized Storage</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] text-[#ef233c] mb-1">
                    PPoS
                  </div>
                  <p className="text-xs text-zinc-500">Pure Proof of Stake</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
