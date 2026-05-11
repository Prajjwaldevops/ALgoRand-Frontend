export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const ALGO_NETWORK = process.env.NEXT_PUBLIC_ALGO_NETWORK || "testnet";

export const SITE_CONFIG = {
  name: "BountyVault",
  tagline: "The Internet of Bounties.",
  description: "A trustless bounty platform built on Algorand blockchain.",
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  open: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  submitted: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  disputed: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  arbitrating: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  expired: { bg: "bg-zinc-500/10", text: "text-zinc-500", dot: "bg-zinc-500" },
  cancelled: { bg: "bg-zinc-500/10", text: "text-zinc-500", dot: "bg-zinc-500" },
};

export const STATS = [
  { label: "Bounties Created", value: 249, suffix: "+" },
  { label: "Total Locked", value: 115, prefix: "$", suffix: "K+" },
  { label: "Block Finality", value: 3.3, suffix: "s" },
  { label: "Tx Cost", value: 0.001, prefix: "<$" },
];

export const FEATURES = [
  {
    title: "Trustless Escrow",
    description: "Smart contracts hold funds — no intermediary. Funds release only when work is approved by the creator.",
    icon: "Shield",
    color: "vault-purple",
  },
  {
    title: "IPFS Storage",
    description: "Work submissions and bounty terms are pinned to IPFS via Pinata for permanent, decentralized storage.",
    icon: "Database",
    color: "vault-cyan",
  },
  {
    title: "Smart Contracts",
    description: "ARC4-compliant PyTeal contracts on Algorand AVM with on-chain state tracking and atomic transactions.",
    icon: "Code",
    color: "vault-magenta",
  },
  {
    title: "Dispute Resolution",
    description: "Neutral arbitrator model — disputes escalate to an independent party, not the creator. True trustlessness.",
    icon: "Scale",
    color: "vault-pink",
  },
  {
    title: "Reputation System",
    description: "Worker reputation scores update on every completed bounty. Build your on-chain track record.",
    icon: "Star",
    color: "vault-amber",
  },
  {
    title: "Public Explorer",
    description: "Browse all open bounties without authentication. Filter by tags, rewards, deadlines, and status.",
    icon: "Search",
    color: "vault-green",
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Create a Bounty",
    description: "Define your task, set the ALGO reward, and lock funds in the smart contract escrow.",
    icon: "PlusCircle",
  },
  {
    step: 2,
    title: "Submit Work",
    description: "Workers submit proof via IPFS. Submissions are hashed on-chain for tamper-proof verification.",
    icon: "Upload",
  },
  {
    step: 3,
    title: "Get Paid",
    description: "Creator approves the work, smart contract automatically releases ALGO to the worker's wallet.",
    icon: "Wallet",
  },
];

export const MOCK_BOUNTIES = [
  {
    id: "b1",
    title: "Build a DeFi Dashboard",
    description: "Create a responsive dashboard showing Algorand DeFi protocol metrics, TVL, and yield data.",
    reward_algo: 50,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "open",
    tags: ["frontend", "defi", "react"],
    submission_count: 3,
    max_submissions: 10,
    creator: { username: "algo_builder", reputation_score: 12 },
  },
  {
    id: "b2",
    title: "Smart Contract Security Audit",
    description: "Perform a comprehensive security audit on BountyVault's PyTeal escrow contract.",
    reward_algo: 150,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: "open",
    tags: ["security", "audit", "pyteal"],
    submission_count: 1,
    max_submissions: 5,
    creator: { username: "chain_sec", reputation_score: 24 },
  },
  {
    id: "b3",
    title: "IPFS Pinning Microservice",
    description: "Build a Go microservice for efficient IPFS pinning with retry logic and queue management.",
    reward_algo: 75,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in_progress",
    tags: ["backend", "go", "ipfs"],
    submission_count: 5,
    max_submissions: 5,
    creator: { username: "decentralizer", reputation_score: 8 },
  },
  {
    id: "b4",
    title: "Mobile Wallet Integration",
    description: "Integrate Pera Wallet SDK with React Native for seamless mobile bounty interactions.",
    reward_algo: 100,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "open",
    tags: ["mobile", "react-native", "wallet"],
    submission_count: 0,
    max_submissions: 8,
    creator: { username: "mobile_dev", reputation_score: 15 },
  },
];
