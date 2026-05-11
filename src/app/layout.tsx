import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Providers } from "@/components/Providers";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BountyVault — Decentralized Bounty Escrow on Algorand",
  description:
    "A trustless bounty platform built on Algorand blockchain. Create bounties, submit work, and get paid through secure smart contract escrow. Fast, transparent, and cost-effective.",
  keywords: [
    "bounty",
    "escrow",
    "algorand",
    "blockchain",
    "decentralized",
    "smart contract",
    "IPFS",
    "trustless",
  ],
  openGraph: {
    title: "BountyVault — Decentralized Bounty Escrow",
    description:
      "Create bounties, submit work proofs, and get paid through Algorand smart contract escrow.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
        <body className="noise-overlay min-h-screen bg-black text-white relative overflow-x-hidden">
          {/* Global Background — Star field + red orb + grid */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a0505] to-black" />
            <div className="absolute top-0 left-0 w-[1px] h-[1px] bg-transparent stars-1 animate-[animStar_50s_linear_infinite]" />
            <div className="absolute top-0 left-0 w-[2px] h-[2px] bg-transparent stars-2 animate-[animStar_80s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)]" />
          </div>

          {/* Top Blur Header */}
          <div className="gradient-blur" />

          <Providers>
            <div className="relative z-10">
              <Navbar />
              <main>{children}</main>
              <Footer />
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
