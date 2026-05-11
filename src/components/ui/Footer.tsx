"use client";

import Link from "next/link";
import { ExternalLink, Globe, MessageCircle } from "lucide-react";

const FOOTER_LINKS = {
  Platform: [
    { label: "Explore Bounties", href: "/bounties" },
    { label: "Create Bounty", href: "/create" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "#" },
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
    <footer className="bg-black border-t border-zinc-900 pt-20 pb-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-24 relative z-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-[#ef233c] rounded-sm rotate-45" />
            <span className="text-2xl font-bold font-[var(--font-heading)] tracking-tight text-white">
              BountyVault
            </span>
          </Link>
          <p className="text-zinc-500 max-w-xs leading-relaxed mb-6">
            Decentralized bounty escrow on Algorand. Trustless, transparent, and
            lightning-fast. Built for the future of work.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Algorand Testnet
            </span>
          </div>
        </div>

        {/* Links */}
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <h4 className="text-xs font-bold text-[#ef233c] uppercase tracking-widest mb-6">{title}</h4>
            <ul className="space-y-4 text-zinc-400 text-sm">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors flex items-center gap-1 group"
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

      {/* Huge Footer Text */}
      <div className="flex justify-center items-center py-10 opacity-[0.03] pointer-events-none select-none">
        <h1 className="text-[15vw] leading-none font-bold font-[var(--font-heading)] tracking-tighter text-stroke">
          BOUNTYVAULT
        </h1>
      </div>

      {/* Bottom */}
      <div className="max-w-7xl mx-auto px-6 border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between text-zinc-600 text-[10px] uppercase tracking-widest">
        <p>&copy; 2026 BountyVault. Built for AlgoBharat Hackathon.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-zinc-400 transition-colors">Twitter</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
