"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Wallet, Zap, LayoutDashboard } from "lucide-react";
import { Button } from "./Button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logoutUser } = useAuth();
  const { isSignedIn } = useUser();
  const { accountAddress, isConnected, connectWallet, disconnectWallet } = useWallet();

  // Consider the user "authenticated" if either our context has a user OR Clerk says signed in
  const isAuthenticated = !!user || !!isSignedIn;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Role-aware navigation links
  const navLinks = useMemo(() => {
    const base = [{ href: "/", label: "Home" }, { href: "/dao", label: "DAO Court" }];

    if (!user) {
      return [
        ...base,
        { href: "/bounties", label: "Explore" },
      ];
    }

    if (user.role === "creator") {
      return [
        ...base,
        { href: "/bounties", label: "Explore" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/create", label: "Create Bounty" },
      ];
    }

    // Freelancer
    return [
      ...base,
      { href: "/bounties", label: "Browse Bounties" },
      { href: "/dashboard", label: "Dashboard" },
    ];
  }, [user]);

  const roleLabel = user?.role === "creator" ? "Creator" : "Freelancer";
  const roleColor = "text-red-300";

  return (
    <>
      <nav
        id="main-navbar"
        className="fixed top-0 left-0 right-0 z-50 pt-4 sm:pt-6 px-4"
      >
        <div
          className={`max-w-5xl mx-auto flex items-center justify-between rounded-full px-6 py-3 transition-all duration-500 ${
            scrolled
              ? "bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl"
              : "bg-black/40 backdrop-blur-md border border-white/5"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-5 h-5 bg-[#ef233c] rounded-sm rotate-45 group-hover:shadow-[0_0_15px_rgba(239,35,60,0.5)] transition-shadow" />
            <span className="text-lg font-bold font-[var(--font-heading)] tracking-tight text-white">
              BountyVault
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors rounded-lg"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected && accountAddress ? (
              <div
                className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-colors"
                onClick={disconnectWallet}
                title="Click to disconnect"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-zinc-400 font-mono">
                  {accountAddress.slice(0, 4)}...{accountAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <Button onClick={() => connectWallet()} size="sm" variant="secondary" id="connect-wallet-btn">
                <Wallet className="w-4 h-4" />
                Connect
              </Button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-2 border-l border-white/10 pl-4">
                {/* User avatar + role badge */}
                <Link href="/dashboard" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ef233c] to-red-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 group-hover:shadow-[0_0_12px_rgba(239,35,60,0.4)] transition-shadow">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      (user?.first_name || user?.display_name || user?.username)?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white leading-tight">
                      {user?.first_name || user?.username || "Loading..."}
                    </span>
                    <span className={`text-[9px] uppercase tracking-wider font-medium ${roleColor} leading-tight`}>
                      {user ? roleLabel : ""}
                    </span>
                  </div>
                </Link>
                <Button size="sm" variant="ghost" onClick={logoutUser}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-white/5 px-6 py-2 transition-transform active:scale-95">
                  <span className="absolute inset-0 border border-white/10 rounded-full" />
                  <span className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ef233c_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute inset-[1px] rounded-full bg-black" />
                  <span className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                    Sign In
                  </span>
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 pt-24 bg-black/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col items-center gap-4 p-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-xl font-medium text-zinc-400 hover:text-white transition-colors py-3"
                >
                  {link.label}
                </Link>
              ))}

              {user && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="text-xl font-medium text-zinc-400 hover:text-white transition-colors py-3 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" /> Dashboard
                </Link>
              )}

              <div className="w-full h-px bg-white/10 my-4" />

              {/* User info on mobile */}
              {user && (
                <div className="flex items-center gap-3 mb-4 bg-white/5 border border-white/10 px-4 py-3 rounded-xl w-full justify-center">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ef233c] to-red-800 flex items-center justify-center text-white text-sm font-bold">
                    {(user.first_name || user.username)?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.first_name || user.username}</p>
                    <p className={`text-[10px] uppercase tracking-wider font-medium ${roleColor}`}>{roleLabel}</p>
                  </div>
                </div>
              )}

              {isConnected && accountAddress ? (
                <div
                  className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-xl w-full cursor-pointer"
                  onClick={() => { disconnectWallet(); setMobileOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-zinc-400 font-mono">
                    {accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}
                  </span>
                </div>
              ) : (
                <Button onClick={() => connectWallet()} size="lg" variant="primary" className="w-full">
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </Button>
              )}
              {isAuthenticated ? (
                <Button variant="secondary" size="lg" className="w-full" onClick={() => { logoutUser(); setMobileOpen(false); }}>
                  Sign Out
                </Button>
              ) : (
                <Link href="/auth" className="w-full" onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" size="lg" className="w-full">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
