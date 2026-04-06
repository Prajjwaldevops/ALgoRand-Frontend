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
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 3D Background */}
      <HeroScene />

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-vault-bg to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24 pb-20">
        <ScrollReveal delay={0.1}>
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-vault-green animate-pulse" />
            <span className="text-xs sm:text-sm text-vault-text-secondary">
              Live on Algorand Testnet
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <h1 className="text-display mb-6">
            The Internet of{" "}
            <span className="gradient-text">Bounties.</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <p className="text-hero-sub max-w-2xl mx-auto mb-10">
            A trustless bounty platform built on Algorand. Create bounties with locked
            ALGO rewards, submit verifiable work proofs via IPFS, and get paid through
            smart contract escrow. No intermediaries. No trust required.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/bounties">
              <Button size="lg" variant="primary" id="explore-bounties-cta">
                Explore Bounties
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/create">
              <Button size="lg" variant="secondary" id="create-bounty-cta">
                <Wallet className="w-4 h-4" />
                Create a Bounty
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        {/* Scroll indicator */}
        <ScrollReveal delay={0.8}>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="w-5 h-9 rounded-full border border-vault-text-muted/30 flex justify-center pt-2">
              <div className="w-1 h-2.5 rounded-full bg-vault-purple animate-bounce" />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
