"use client";

import { FEATURES } from "@/lib/constants";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Shield, Database, Code, Scale, Star, Search } from "lucide-react";

const ICONS = {
  Shield,
  Database,
  Code,
  Scale,
  Star,
  Search,
};

const ICON_ACCENT_COLORS: Record<string, string> = {
  "vault-purple": "text-[#ef233c]",
  "vault-cyan": "text-blue-400",
  "vault-magenta": "text-purple-400",
  "vault-pink": "text-pink-400",
  "vault-amber": "text-yellow-400",
  "vault-green": "text-emerald-400",
};

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight font-[var(--font-heading)] mb-6">
              Secured by the{" "}
              <span className="text-[#ef233c]">ALGO.</span>
            </h2>
            <p className="text-lg text-zinc-400 font-light">
              Built on Algorand&apos;s carbon-negative blockchain with enterprise-grade security and near-instant finality.
            </p>
          </div>
        </ScrollReveal>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-auto lg:h-[700px]">
          {/* Main Feature Card — 2x2 */}
          {FEATURES.slice(0, 1).map((feature) => {
            const Icon = ICONS[feature.icon as keyof typeof ICONS];
            return (
              <ScrollReveal key={feature.title} direction="up">
                <div className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden p-8 border border-white/10 bg-gradient-to-b from-zinc-900/50 to-black hover:border-white/20 transition-all rounded-xl h-full">
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="mb-6 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 text-[#ef233c] w-fit">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-semibold text-white font-[var(--font-heading)] mb-4 tracking-tight">{feature.title}</h3>
                    <p className="text-zinc-400 text-lg leading-relaxed">{feature.description}</p>
                    <div className="mt-auto flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 pt-6">
                      <span className="text-xs font-mono text-[#ef233c]">EXPLORE FEATURE</span>
                      <span className="text-[#ef233c]">→</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at top right, #ef233c, transparent 70%)" }} />
                </div>
              </ScrollReveal>
            );
          })}

          {/* Feature 2 — wide */}
          {FEATURES.slice(1, 2).map((feature) => {
            const Icon = ICONS[feature.icon as keyof typeof ICONS];
            const iconColor = ICON_ACCENT_COLORS[feature.color] || "text-[#ef233c]";
            return (
              <ScrollReveal key={feature.title} direction="up" delay={0.1}>
                <div className="lg:col-span-2 group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-xl h-full">
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 w-fit">
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <h3 className="text-2xl font-semibold text-white font-[var(--font-heading)] mb-2">{feature.title}</h3>
                    <p className="text-zinc-400">{feature.description}</p>
                  </div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at top right, #3b82f6, transparent 70%)" }} />
                </div>
              </ScrollReveal>
            );
          })}

          {/* Remaining features — single column each */}
          {FEATURES.slice(2).map((feature, i) => {
            const Icon = ICONS[feature.icon as keyof typeof ICONS];
            const iconColor = ICON_ACCENT_COLORS[feature.color] || "text-[#ef233c]";
            return (
              <ScrollReveal key={feature.title} delay={(i + 2) * 0.08} direction="up">
                <div className="group relative overflow-hidden p-8 border border-white/10 bg-black hover:border-white/20 transition-all rounded-xl h-full">
                  <div className="relative z-10">
                    <div className="mb-4 inline-flex p-3 rounded-lg bg-white/5 border border-white/10 w-fit">
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white font-[var(--font-heading)] mb-2">{feature.title}</h3>
                    <p className="text-sm text-zinc-400">{feature.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
