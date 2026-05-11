"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import {
  LayoutDashboard,
  Plus,
  Briefcase,
  Activity,
  ShieldAlert,
  Search,
  FileCheck,
  Zap,
  Receipt,
  User,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HandshakeIcon,
} from "lucide-react";
import { useState } from "react";

const CREATOR_NAV = [
  { href: "/dashboard/creator", label: "Overview", icon: LayoutDashboard },
  { href: "/create", label: "Create Bounty", icon: Plus },
  { href: "/dashboard/creator/bounties", label: "My Bounties", icon: Briefcase },
  { href: "/dashboard/creator/acceptances", label: "Review Acceptances", icon: HandshakeIcon },
  { href: "/dashboard/creator/status", label: "Bounty Status", icon: Activity },
  { href: "/dashboard/creator/disputes", label: "Disputes", icon: ShieldAlert },
  { href: "/dashboard/creator/transactions", label: "Transactions", icon: Receipt },
];

const FREELANCER_NAV = [
  { href: "/dashboard/freelancer", label: "Overview", icon: LayoutDashboard },
  { href: "/bounties", label: "Browse Bounties", icon: Search },
  { href: "/dashboard/freelancer/acceptances", label: "My Acceptances", icon: HandshakeIcon },
  { href: "/dashboard/freelancer/working", label: "Working Bounties", icon: Zap },
  { href: "/dashboard/freelancer/submissions", label: "My Submissions", icon: FileCheck },
  { href: "/dashboard/freelancer/status", label: "Bounty Status", icon: Activity },
  { href: "/dashboard/freelancer/disputes", label: "Disputes", icon: ShieldAlert },
  { href: "/dashboard/freelancer/transactions", label: "Transactions", icon: Receipt },
  { href: "/profile", label: "Profile", icon: User },
];

export function DashboardSidebar() {
  const { user, logoutUser } = useAuth();
  const { accountAddress, isConnected } = useWallet();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navItems = user.role === "creator" ? CREATOR_NAV : FREELANCER_NAV;
  const roleLabel = user.role === "creator" ? "Creator" : "Freelancer";

  return (
    <aside
      className={`sticky top-20 h-[calc(100vh-5rem)] flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Glass sidebar container */}
      <div className="flex-1 border border-white/10 bg-black rounded-xl p-3 flex flex-col overflow-hidden">
        {/* User info */}
        <div className={`flex items-center gap-3 p-3 mb-2 rounded-xl bg-white/5 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ef233c] to-red-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              (user.first_name || user.display_name || user.username)?.charAt(0).toUpperCase() || "U"
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">
                {user.first_name
                  ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`
                  : user.display_name || user.username}
              </p>
              <span className="text-[10px] uppercase tracking-wider font-medium text-red-300 bg-[#ef233c]/10 px-1.5 py-0.5 rounded">
                {roleLabel}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-[#ef233c] text-white shadow-lg shadow-[#ef233c]/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-zinc-600 group-hover:text-white"}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Wallet status */}
        <div className={`mt-2 px-3 py-2 rounded-xl bg-white/5 ${collapsed ? "text-center" : ""}`}>
          {isConnected && accountAddress ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              {!collapsed && (
                <span className="text-xs text-zinc-500 font-mono truncate">
                  {accountAddress.slice(0, 4)}...{accountAddress.slice(-4)}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              {!collapsed && (
                <Link href="/auth/link-wallet" className="text-xs text-amber-400 hover:underline">
                  Connect Wallet
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={logoutUser}
          className={`mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-red-900/10 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mt-2 mx-auto w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
