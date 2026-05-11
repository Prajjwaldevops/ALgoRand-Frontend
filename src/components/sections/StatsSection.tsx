"use client";

import { STATS } from "@/lib/constants";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function StatsSection() {
  return (
    <section id="stats" className="relative py-16 sm:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 sm:p-10 rounded-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {STATS.map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 0.1} direction="up">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold font-[var(--font-heading)] mb-2 text-white">
                    <AnimatedCounter
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      decimals={stat.value % 1 !== 0 ? 1 : 0}
                    />
                  </div>
                  <div className="text-sm text-zinc-500">
                    {stat.label}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
