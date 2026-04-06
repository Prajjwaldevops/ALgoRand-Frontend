import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
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

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
      <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
        <body className="noise-overlay">
          <Providers>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
