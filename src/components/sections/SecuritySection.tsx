"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Lock, Eye, Cpu, Zap, Star } from "lucide-react";

const SECURITY_ITEMS = [
  {
    icon: Lock,
    title: "On-chain escrow.",
    description: "Funds locked in ARC4 smart contracts. Only released on approval or dispute resolution.",
  },
  {
    icon: Eye,
    title: "Transparent auditing.",
    description: "Every transaction includes a structured note readable in any Algorand block explorer.",
  },
  {
    icon: Cpu,
    title: "Immutable records.",
    description: "Work proofs pinned to IPFS with SHA-256 hashes stored on-chain. Tamper-proof verification.",
  },
  {
    icon: Zap,
    title: "3.3s finality.",
    description: "Algorand's pure proof-of-stake delivers near-instant transaction confirmation.",
  },
];

export function SecuritySection() {
  return (
    <>
      {/* Testimonial Banner */}
      <div className="w-full bg-[#ef233c] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 text-black mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-6 h-6 fill-current" />
            ))}
          </div>
          <h3 className="text-3xl md:text-5xl font-bold text-black font-[var(--font-heading)] leading-tight mb-8">
            &ldquo;BountyVault has completely transformed how we ship products. What used to take weeks now takes hours.&rdquo;
          </h3>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-black rounded-full overflow-hidden flex items-center justify-center">
              <span className="text-white text-lg font-bold">A</span>
            </div>
            <div className="text-left">
              <div className="text-black font-bold text-lg">Alex Morgan</div>
              <div className="text-black/70 font-medium">CPO at TechFlow</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <section id="security" className="relative py-24 sm:py-32 section-gradient overflow-hidden">
        {/* Large background orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#ef233c]/5 blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Visual */}
            <ScrollReveal direction="left">
              <div className="relative">
                <div className="aspect-square max-w-md mx-auto relative">
                  {/* Concentric rings */}
                  <div className="absolute inset-8 rounded-full border border-[#ef233c]/10 animate-spin-slow" />
                  <div className="absolute inset-16 rounded-full border border-[#ef233c]/10 animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "40s" }} />
                  <div className="absolute inset-24 rounded-full border border-[#ef233c]/10 animate-spin-slow" style={{ animationDuration: "50s" }} />

                  {/* Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#ef233c]/30 to-red-900/20 flex items-center justify-center backdrop-blur-sm border border-[#ef233c]/20 shadow-[0_0_60px_rgba(239,35,60,0.2)]">
                      <Lock className="w-12 h-12 text-[#ef233c]" />
                    </div>
                  </div>

                  {/* Orbiting dots */}
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 rounded-full bg-[#ef233c] animate-pulse"
                      style={{
                        top: `${50 + 35 * Math.sin((i * Math.PI) / 2)}%`,
                        left: `${50 + 35 * Math.cos((i * Math.PI) / 2)}%`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Right: Content */}
            <div>
              <ScrollReveal>
                <h2 className="text-section-title mb-4">
                  Be part of the open{" "}
                  <span className="text-[#ef233c]">economy of the future.</span>
                </h2>
                <p className="text-section-sub mb-10">
                  Every bounty, submission, and payout is verifiable on-chain. Your reputation is yours — portable and permanent.
                </p>
              </ScrollReveal>

              <div className="space-y-6">
                {SECURITY_ITEMS.map((item, i) => (
                  <ScrollReveal key={item.title} delay={i * 0.1}>
                    <div className="flex gap-4 group">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#ef233c]/10 flex items-center justify-center group-hover:bg-[#ef233c]/20 transition-colors border border-[#ef233c]/10">
                        <item.icon className="w-5 h-5 text-[#ef233c]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-1 text-white">{item.title}</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
