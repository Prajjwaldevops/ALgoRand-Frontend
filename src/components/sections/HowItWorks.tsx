"use client";

import { HOW_IT_WORKS } from "@/lib/constants";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { PlusCircle, Upload, Wallet } from "lucide-react";

const ICONS = {
  PlusCircle: PlusCircle,
  Upload: Upload,
  Wallet: Wallet,
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 section-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-section-title mb-4">
              The heart of the{" "}
              <span className="text-[#ef233c]">Interchain.</span>
            </h2>
            <p className="text-section-sub max-w-2xl mx-auto">
              Three simple steps to create trustless bounties on the Algorand blockchain.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-[#ef233c]/30 via-[#ef233c]/20 to-[#ef233c]/30" />

          {HOW_IT_WORKS.map((step, i) => {
            const Icon = ICONS[step.icon as keyof typeof ICONS];
            return (
              <ScrollReveal key={step.step} delay={i * 0.15} direction="up">
                <div className="relative text-center group">
                  {/* Step Number Glow */}
                  <div className="relative mx-auto w-28 h-28 mb-6">
                    <div className="absolute inset-0 rounded-full bg-[#ef233c]/10 animate-pulse-glow" />
                    <div className="relative w-full h-full rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#ef233c]/30 transition-colors backdrop-blur-sm">
                      <Icon className="w-10 h-10 text-[#ef233c]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#ef233c] flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-[#ef233c]/30">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold font-[var(--font-heading)] mb-3 text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
