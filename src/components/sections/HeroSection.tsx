"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";

const HeroScene = dynamic(
  () => import("@/components/3d/HeroScene").then((m) => ({ default: m.HeroScene })),
  { ssr: false }
);

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-32 pb-20 px-6"
    >
      {/* 3D Background (behind everything) */}
      <HeroScene />

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <ScrollReveal delay={0.1}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]" />
            </span>
            <span className="text-xs font-medium text-red-100/90 tracking-wide font-[var(--font-heading)]">
              Live on Algorand Testnet
            </span>
            <ArrowRight className="w-3 h-3 text-red-400" />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter font-[var(--font-heading)] leading-[1.1] mb-8">
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              The Internet of
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
              <span className="text-[#ef233c] inline-block relative">
                Bounties.
                <svg className="absolute w-full h-3 -bottom-2 left-0 text-[#ef233c] opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
            </span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            A trustless bounty platform built on Algorand. Create bounties with locked
            ALGO rewards, submit verifiable work proofs via IPFS, and get paid through
            smart contract escrow.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link href="/bounties">
              <button id="explore-bounties-cta" className="shiny-cta group">
                <span className="relative z-10 flex items-center gap-2 text-white font-medium">
                  Explore Bounties
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </Link>

            <Link href="/create">
              <button id="create-bounty-cta" className="group px-8 py-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Create a Bounty
              </button>
            </Link>
          </div>
        </ScrollReveal>
      </div>

      {/* Logo Strip */}
      <ScrollReveal delay={0.6}>
        <div className="w-full mt-32 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm py-10 opacity-60 hover:opacity-100 transition-opacity">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <p className="text-sm font-bold tracking-widest text-zinc-500 uppercase shrink-0">Powered by:</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center w-full">
              <div className="flex items-center gap-2 font-[var(--font-heading)] font-semibold text-zinc-300"><div className="w-6 h-6 bg-white/20 rounded-full" />Algorand</div>
              <div className="flex items-center gap-2 font-[var(--font-heading)] font-semibold text-zinc-300"><div className="w-6 h-6 bg-white/20 rounded-full" />IPFS</div>
              <div className="flex items-center gap-2 font-[var(--font-heading)] font-semibold text-zinc-300"><div className="w-6 h-6 bg-white/20 rounded-full" />PyTeal</div>
              <div className="flex items-center gap-2 font-[var(--font-heading)] font-semibold text-zinc-300"><div className="w-6 h-6 bg-white/20 rounded-full" />Pera Wallet</div>
              <div className="flex items-center gap-2 font-[var(--font-heading)] font-semibold text-zinc-300"><div className="w-6 h-6 bg-white/20 rounded-full" />Pinata</div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
