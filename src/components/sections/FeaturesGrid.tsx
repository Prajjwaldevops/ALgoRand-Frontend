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

const COLORS: Record<string, string> = {
  "vault-purple": "from-vault-purple/20 to-vault-purple/5 border-vault-purple/20 hover:border-vault-purple/40",
  "vault-cyan": "from-vault-cyan/20 to-vault-cyan/5 border-vault-cyan/20 hover:border-vault-cyan/40",
  "vault-magenta": "from-vault-magenta/20 to-vault-magenta/5 border-vault-magenta/20 hover:border-vault-magenta/40",
  "vault-pink": "from-vault-pink/20 to-vault-pink/5 border-vault-pink/20 hover:border-vault-pink/40",
  "vault-amber": "from-vault-amber/20 to-vault-amber/5 border-vault-amber/20 hover:border-vault-amber/40",
  "vault-green": "from-vault-green/20 to-vault-green/5 border-vault-green/20 hover:border-vault-green/40",
};

const ICON_COLORS: Record<string, string> = {
  "vault-purple": "text-vault-purple-light",
  "vault-cyan": "text-vault-cyan",
  "vault-magenta": "text-vault-magenta",
  "vault-pink": "text-vault-pink",
  "vault-amber": "text-vault-amber",
  "vault-green": "text-vault-green",
};

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-section-title mb-4">
              Secured by the{" "}
              <span className="gradient-text">ALGO.</span>
            </h2>
            <p className="text-section-sub max-w-2xl mx-auto">
              Built on Algorand&apos;s carbon-negative blockchain with enterprise-grade security and near-instant finality.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = ICONS[feature.icon as keyof typeof ICONS];
            const colorClass = COLORS[feature.color] || COLORS["vault-purple"];
            const iconColor = ICON_COLORS[feature.color] || ICON_COLORS["vault-purple"];

            return (
              <ScrollReveal key={feature.title} delay={i * 0.08} direction="up">
                <div
                  className={`group relative p-6 sm:p-7 rounded-2xl border bg-gradient-to-b ${colorClass} backdrop-blur-sm transition-all duration-400 hover:translate-y-[-3px]`}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-vault-bg/50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>

                  <h3 className="text-base font-semibold font-[var(--font-heading)] mb-2.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-vault-text-secondary leading-relaxed">
                    {feature.description}
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
