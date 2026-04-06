"use client";

import Link from "next/link";
import { Zap, ExternalLink, Globe, MessageCircle } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Explore Bounties", href: "/bounties" },
    { label: "Create Bounty", href: "/create" },
    { label: "How It Works", href: "/#how-it-works" },
  ],
  Developers: [
    { label: "Documentation", href: "#" },
    { label: "Smart Contract", href: "#" },
    { label: "API Reference", href: "#" },
  ],
  Community: [
    { label: "GitHub", href: "#" },
    { label: "Discord", href: "#" },
    { label: "Twitter", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t border-vault-border bg-vault-bg">
      {/* Glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-vault-purple/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-vault-purple to-vault-cyan flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold font-[var(--font-heading)]">
                <span className="text-vault-text">Bounty</span>
                <span className="gradient-text">Vault</span>
              </span>
            </Link>
            <p className="text-sm text-vault-text-secondary max-w-xs leading-relaxed mb-6">
              Decentralized bounty escrow on Algorand. Trustless, transparent, and
              lightning-fast. Built for the future of work.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vault-green/10 text-vault-green text-xs font-medium border border-vault-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-vault-green animate-pulse" />
                Algorand Testnet
              </span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-vault-text mb-4">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-vault-text-secondary hover:text-vault-text transition-colors flex items-center gap-1 group"
                    >
                      {link.label}
                      {link.href === "#" && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-vault-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-vault-text-muted">
            © 2026 BountyVault. Built for AlgoBharat Hackathon.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-vault-text-muted hover:text-vault-text transition-colors">
              <Globe className="w-4 h-4" />
            </a>
            <a href="#" className="text-vault-text-muted hover:text-vault-text transition-colors">
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
