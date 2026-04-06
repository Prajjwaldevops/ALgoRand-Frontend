"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type AdminStats = {
  total_freelancers: number;
  total_creators: number;
  total_bounties: number;
  open_bounties: number;
  in_progress_bounties: number;
  completed_bounties: number;
  disputed_bounties: number;
  total_submissions: number;
  accepted_submissions: number;
  total_algo_volume: number;
  total_algo_paid_out: number;
  active_disputes: number;
  total_transactions: number;
};

type TabType = "overview" | "users" | "bounties" | "transactions" | "disputes";

function useAdminFetch<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        localStorage.removeItem("admin_token");
        router.replace("/admin/login");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error);
      }
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [endpoint, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ========================
// Stat Card Component
// ========================
function StatCard({ label, value, icon, color = "purple" }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    purple: "from-vault-purple/20 to-vault-purple/5 border-vault-purple/30",
    cyan: "from-vault-cyan/20 to-vault-cyan/5 border-vault-cyan/30",
    green: "from-vault-green/20 to-vault-green/5 border-vault-green/30",
    amber: "from-vault-amber/20 to-vault-amber/5 border-vault-amber/30",
    red: "from-vault-red/20 to-vault-red/5 border-vault-red/30",
    pink: "from-vault-pink/20 to-vault-pink/5 border-vault-pink/30",
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-vault-text-secondary text-sm">{label}</span>
        <div className="text-vault-text-muted">{icon}</div>
      </div>
      <p className="text-2xl font-heading font-bold text-vault-text">{value}</p>
    </div>
  );
}

// ========================
// Sidebar Component
// ========================
function AdminSidebar({ active, onNavigate }: { active: TabType; onNavigate: (t: TabType) => void }) {
  const adminUser = typeof window !== "undefined" ? localStorage.getItem("admin_username") || "Admin" : "Admin";

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      ),
    },
    {
      id: "users",
      label: "Users",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
      ),
    },
    {
      id: "bounties",
      label: "Bounties",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      ),
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
      ),
    },
    {
      id: "disputes",
      label: "Disputes",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      ),
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-vault-surface border-r border-vault-border flex flex-col">
      <div className="p-6 border-b border-vault-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-vault-purple to-vault-cyan flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="font-heading font-bold text-vault-text text-sm">BountyVault</p>
            <p className="text-xs text-vault-purple">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              active === tab.id
                ? "bg-vault-purple/15 text-vault-purple border border-vault-purple/30"
                : "text-vault-text-secondary hover:bg-vault-card hover:text-vault-text"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-vault-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-vault-purple/20 flex items-center justify-center text-vault-purple text-sm font-bold">
            {adminUser[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-vault-text truncate">{adminUser}</p>
            <p className="text-xs text-vault-text-muted">Administrator</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("admin_token");
              localStorage.removeItem("admin_username");
              window.location.href = "/admin/login";
            }}
            className="p-1.5 rounded-lg hover:bg-vault-red/10 text-vault-text-muted hover:text-vault-red transition-colors"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ========================
// Overview Tab
// ========================
function OverviewTab() {
  const { data: stats, loading } = useAdminFetch<AdminStats>("/api/admin/stats");

  if (loading) return <LoadingSpinner />;
  if (!stats) return <p className="text-vault-text-muted">Failed to load stats</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-heading font-semibold text-vault-text mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={(stats.total_freelancers + stats.total_creators).toLocaleString()} color="purple"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
          <StatCard label="Total Bounties" value={stats.total_bounties.toLocaleString()} color="cyan"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} />
          <StatCard label="ALGO Volume" value={`${stats.total_algo_volume.toLocaleString()} Ⱥ`} color="green"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <StatCard label="ALGO Paid Out" value={`${stats.total_algo_paid_out.toLocaleString()} Ⱥ`} color="amber"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-heading font-semibold text-vault-text mb-4">Bounty Breakdown</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Open" value={stats.open_bounties} color="cyan" icon={<span className="text-lg">📂</span>} />
          <StatCard label="In Progress" value={stats.in_progress_bounties} color="amber" icon={<span className="text-lg">⏳</span>} />
          <StatCard label="Completed" value={stats.completed_bounties} color="green" icon={<span className="text-lg">✅</span>} />
          <StatCard label="Disputed" value={stats.disputed_bounties} color="red" icon={<span className="text-lg">⚖️</span>} />
          <StatCard label="Active Disputes" value={stats.active_disputes} color="pink" icon={<span className="text-lg">🔥</span>} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-heading font-semibold text-vault-text mb-4">Activity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Freelancers" value={stats.total_freelancers} color="purple" icon={<span className="text-lg">👩‍💻</span>} />
          <StatCard label="Creators" value={stats.total_creators} color="cyan" icon={<span className="text-lg">🏢</span>} />
          <StatCard label="Transactions" value={stats.total_transactions.toLocaleString()} color="green" icon={<span className="text-lg">📝</span>} />
        </div>
      </div>
    </div>
  );
}

// ========================
// Users Tab
// ========================
function UsersTab() {
  const { data, loading } = useAdminFetch<{ items: Record<string, unknown>[]; total: number }>("/api/admin/users?page_size=50");

  if (loading) return <LoadingSpinner />;
  const users = data?.items || [];

  return (
    <div>
      <h2 className="text-lg font-heading font-semibold text-vault-text mb-4">All Users ({data?.total || 0})</h2>
      <div className="overflow-x-auto rounded-xl border border-vault-border">
        <table className="w-full text-sm">
          <thead className="bg-vault-surface">
            <tr className="border-b border-vault-border">
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">User</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Email</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Role</th>
              <th className="text-right px-4 py-3 text-vault-text-secondary font-medium">Rep</th>
              <th className="text-right px-4 py-3 text-vault-text-secondary font-medium">Earned</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className="border-b border-vault-border/50 hover:bg-vault-card/50 transition-colors">
                <td className="px-4 py-3 text-vault-text font-medium">{String(u.username)}</td>
                <td className="px-4 py-3 text-vault-text-secondary">{String(u.email)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === "creator" ? "bg-vault-cyan/15 text-vault-cyan" : "bg-vault-purple/15 text-vault-purple"
                  }`}>
                    {String(u.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-vault-text">{Number(u.reputation_score)}</td>
                <td className="px-4 py-3 text-right text-vault-green font-mono">{Number(u.total_earned_algo).toFixed(2)} Ⱥ</td>
                <td className="px-4 py-3 text-vault-text-muted">{new Date(String(u.created_at)).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========================
// Bounties Tab
// ========================
function BountiesTab() {
  const { data: bounties, loading } = useAdminFetch<Record<string, unknown>[]>("/api/admin/bounties?page_size=50");

  if (loading) return <LoadingSpinner />;
  if (!bounties) return null;

  const statusColors: Record<string, string> = {
    open: "bg-vault-cyan/15 text-vault-cyan",
    in_progress: "bg-vault-amber/15 text-vault-amber",
    completed: "bg-vault-green/15 text-vault-green",
    disputed: "bg-vault-red/15 text-vault-red",
    expired: "bg-vault-text-muted/15 text-vault-text-muted",
    cancelled: "bg-vault-text-muted/15 text-vault-text-muted",
  };

  return (
    <div>
      <h2 className="text-lg font-heading font-semibold text-vault-text mb-4">All Bounties</h2>
      <div className="overflow-x-auto rounded-xl border border-vault-border">
        <table className="w-full text-sm">
          <thead className="bg-vault-surface">
            <tr className="border-b border-vault-border">
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">ID</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Title</th>
              <th className="text-right px-4 py-3 text-vault-text-secondary font-medium">Reward</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Status</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Creator</th>
              <th className="text-right px-4 py-3 text-vault-text-secondary font-medium">Subs</th>
            </tr>
          </thead>
          <tbody>
            {bounties.map((b, i) => (
              <tr key={i} className="border-b border-vault-border/50 hover:bg-vault-card/50 transition-colors">
                <td className="px-4 py-3 font-mono text-vault-purple text-xs">{String(b.bounty_id)}</td>
                <td className="px-4 py-3 text-vault-text font-medium max-w-[200px] truncate">{String(b.title)}</td>
                <td className="px-4 py-3 text-right text-vault-green font-mono">{Number(b.reward_algo).toFixed(2)} Ⱥ</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[String(b.status)] || ""}`}>
                    {String(b.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-vault-text-secondary">{String(b.creator_username)}</td>
                <td className="px-4 py-3 text-right text-vault-text">{Number(b.submission_count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========================
// Transactions Tab (with IPFS links)
// ========================
function TransactionsTab() {
  const { data: txns, loading } = useAdminFetch<Record<string, unknown>[]>("/api/admin/transactions?page_size=50");

  if (loading) return <LoadingSpinner />;
  if (!txns) return null;

  const eventColors: Record<string, string> = {
    escrow_locked: "text-vault-cyan",
    work_submitted: "text-vault-purple",
    submission_approved: "text-vault-green",
    submission_rejected: "text-vault-red",
    dispute_raised: "text-vault-amber",
    dao_vote_cast: "text-vault-pink",
    dao_resolved: "text-vault-green",
    freelancer_letgo: "text-vault-text-muted",
    bounty_expired: "text-vault-text-muted",
  };

  return (
    <div>
      <h2 className="text-lg font-heading font-semibold text-vault-text mb-4">Transaction Log</h2>
      <div className="overflow-x-auto rounded-xl border border-vault-border">
        <table className="w-full text-sm">
          <thead className="bg-vault-surface">
            <tr className="border-b border-vault-border">
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Event</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Actor</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Txn ID</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">IPFS</th>
              <th className="text-right px-4 py-3 text-vault-text-secondary font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-vault-text-secondary font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t, i) => (
              <tr key={i} className="border-b border-vault-border/50 hover:bg-vault-card/50 transition-colors">
                <td className={`px-4 py-3 font-mono text-xs font-medium ${eventColors[String(t.event)] || "text-vault-text"}`}>
                  {String(t.event)}
                </td>
                <td className="px-4 py-3 text-vault-text-secondary">{String(t.actor_username)}</td>
                <td className="px-4 py-3">
                  {t.txn_id ? (
                    <a
                      href={`https://testnet.algoexplorer.io/tx/${t.txn_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-vault-cyan hover:underline"
                    >
                      {String(t.txn_id).slice(0, 12)}…
                    </a>
                  ) : (
                    <span className="text-vault-text-muted text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {t.ipfs_gateway_url ? (
                    <a
                      href={String(t.ipfs_gateway_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-vault-purple hover:underline"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                      View
                    </a>
                  ) : (
                    <span className="text-vault-text-muted text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-vault-green text-xs">
                  {t.amount_algo ? `${Number(t.amount_algo).toFixed(2)} Ⱥ` : "—"}
                </td>
                <td className="px-4 py-3 text-vault-text-muted text-xs">{new Date(String(t.created_at)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========================
// Disputes Tab
// ========================
function DisputesTab() {
  const { data: disputes, loading } = useAdminFetch<Record<string, unknown>[]>("/api/admin/disputes");

  if (loading) return <LoadingSpinner />;
  if (!disputes) return null;

  return (
    <div>
      <h2 className="text-lg font-heading font-semibold text-vault-text mb-4">All Disputes</h2>
      <div className="space-y-4">
        {disputes.length === 0 && (
          <p className="text-vault-text-muted text-center py-8">No disputes found</p>
        )}
        {disputes.map((d, i) => (
          <div key={i} className="bg-vault-card border border-vault-border rounded-xl p-5 hover:border-vault-border-hover transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="font-mono text-sm text-vault-purple font-medium">{String(d.dispute_id)}</span>
                <h3 className="text-vault-text font-medium mt-1">{String(d.bounty_title)}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                d.status === "open" ? "bg-vault-amber/15 text-vault-amber" :
                String(d.status).includes("freelancer") ? "bg-vault-green/15 text-vault-green" :
                "bg-vault-red/15 text-vault-red"
              }`}>
                {String(d.status)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-vault-text-muted">Freelancer</p>
                <p className="text-vault-text">{String(d.freelancer_name)}</p>
              </div>
              <div>
                <p className="text-vault-text-muted">Creator</p>
                <p className="text-vault-text">{String(d.creator_name)}</p>
              </div>
              <div>
                <p className="text-vault-text-muted">Votes</p>
                <p className="text-vault-text">
                  <span className="text-vault-cyan">{Number(d.votes_creator)} creator</span>
                  {" / "}
                  <span className="text-vault-purple">{Number(d.votes_freelancer)} freelancer</span>
                </p>
              </div>
              <div>
                <p className="text-vault-text-muted">Reward</p>
                <p className="text-vault-green font-mono">{Number(d.reward_algo).toFixed(2)} Ⱥ</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================
// Loading Spinner
// ========================
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-vault-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ========================
// Main Dashboard Page
// ========================
export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router]);

  const tabNames: Record<TabType, string> = {
    overview: "Platform Overview",
    users: "User Management",
    bounties: "Bounty Management",
    transactions: "Transaction Log",
    disputes: "Dispute Management",
  };

  return (
    <div className="flex min-h-screen bg-vault-bg">
      <AdminSidebar active={activeTab} onNavigate={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-vault-bg/80 backdrop-blur-xl border-b border-vault-border px-8 py-4">
          <h1 className="text-xl font-heading font-bold text-vault-text">{tabNames[activeTab]}</h1>
        </header>
        <div className="p-8">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "bounties" && <BountiesTab />}
          {activeTab === "transactions" && <TransactionsTab />}
          {activeTab === "disputes" && <DisputesTab />}
        </div>
      </main>
    </div>
  );
}
