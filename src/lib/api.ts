import { API_BASE_URL } from "./constants";

/* ============================================
   BountyVault — API Service Layer
   Real API calls to Go backend (Clerk Auth)
   ============================================ */

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// --- Types ---

export interface Profile {
  id: string;
  auth_user_id?: string;
  clerk_id?: string;
  username: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  wallet_address?: string;
  role: "creator" | "freelancer" | "admin" | "arbitrator";
  bio?: string;
  reputation_score: number;
  total_bounties_created: number;
  total_bounties_completed: number;
}

export interface Bounty {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  reward_algo: number;
  terms_ipfs_cid?: string;
  terms_hash?: string;
  deadline: string;
  status: string;
  app_id?: number;
  escrow_txn_id?: string;
  arbitrator_address?: string;
  max_submissions: number;
  submission_count?: number;
  tags: string[] | null;
  creator?: Profile;
  created_at?: string;
}

export interface Submission {
  id: string;
  bounty_id: string;
  freelancer_id: string;
  submission_number?: number;
  mega_nz_link?: string;
  encryption_key_url?: string;
  description?: string;
  status: string;
  rejection_feedback?: string;
  creator_message?: string;
  creator_rating?: number;
  work_hash_sha256?: string;
  submitted_at?: string;
  created_at?: string;
  reviewed_at?: string;
  freelancer?: Profile;
}

// --- Clerk Token Helper ---
// We store a reference to the Clerk getToken function so the API layer can
// attach a Bearer token without importing @clerk/nextjs (avoids circular deps).

let _getToken: (() => Promise<string | null>) | null = null;

/**
 * Called once from AuthContext to inject the Clerk getToken function.
 */
export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // Silently fail — user may not be authenticated
    }
  }
  return headers;
}

async function getAuthHeadersMultipart(): Promise<HeadersInit> {
  const headers: HeadersInit = {};
  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // Silently fail
    }
  }
  return headers;
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const isMultipart = options.body instanceof FormData;
    const authHeaders = isMultipart ? await getAuthHeadersMultipart() : await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...authHeaders, ...options.headers },
    });
    // Try to parse JSON — backend returns structured errors on non-2xx too
    const text = await res.text();
    let data: ApiResponse<T>;
    try {
      data = JSON.parse(text);
    } catch {
      // Response was not JSON (e.g., HTML error page or empty body)
      console.error(`API non-JSON response [${res.status}] ${endpoint}:`, text.substring(0, 500));
      return { success: false, error: `Server error (${res.status}): ${text.substring(0, 200)}` };
    }
    if (!res.ok && res.status !== 401) {
      console.error(`API error [${res.status}] ${endpoint}:`, data);
    }
    return data;
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    return { success: false, error: "Network error — is the backend running?" };
  }
}

// --- Auth ---

export const authApi = {
  /** Sync/provision profile with backend after Clerk auth */
  sync: (
    email: string,
    username?: string,
    role?: string,
    firstName?: string,
    lastName?: string
  ) =>
    apiFetch<Profile>("/api/auth/sync", {
      method: "POST",
      body: JSON.stringify({
        email,
        username,
        role,
        first_name: firstName,
        last_name: lastName,
      }),
    }),

  me: () => apiFetch<Profile>("/api/auth/me"),

  updateProfile: (data: Partial<Profile>) =>
    apiFetch<Profile>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  linkWallet: (walletAddress: string) =>
    apiFetch("/api/auth/wallet", {
      method: "PUT",
      body: JSON.stringify({ wallet_address: walletAddress }),
    }),

  /** Switch role between 'creator' and 'freelancer' */
  switchRole: (role: "creator" | "freelancer") =>
    apiFetch<Profile>("/api/auth/role", {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),
};

// --- Bounties ---

export interface BountyFilters {
  tag?: string;
  status?: string;
  min_reward?: number;
  max_reward?: number;
  sort?: string;
  page?: number;
  page_size?: number;
}

export const bountyApi = {
  list: (filters?: BountyFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== "") params.set(key, String(val));
      });
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<PaginatedResponse<Bounty>>(`/api/bounties${query}`);
  },

  get: (id: string) => apiFetch<Bounty>(`/api/bounties/${id}`),

  create: (data: {
    title: string;
    description: string;
    reward_algo: number;
    deadline: string;
    tags: string[];
    max_submissions: number;
  }) =>
    apiFetch<Bounty>("/api/bounties", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  lock: (id: string, walletAddress: string) =>
    apiFetch<{ transactions: string[]; group_id: string; message: string }>(`/api/bounties/${id}/lock`, {
      method: "POST",
      body: JSON.stringify({ bounty_id: id, wallet_address: walletAddress }),
    }),

  confirmLock: (id: string, signedTxns: string[]) =>
    apiFetch(`/api/bounties/${id}/confirm-lock`, {
      method: "POST",
      body: JSON.stringify({ signed_txns: signedTxns }),
    }),

  /** Build unsigned approve_payout transactions for Pera Wallet signing */
  buildApprovePayout: (id: string, submissionId: string, walletAddress: string) =>
    apiFetch<{ transactions: { transactions: string[]; group_id?: string; message?: string }; freelancer_id: string; payout_wallet: string }>(
      `/api/bounties/${id}/build-approve-payout`,
      {
        method: "POST",
        body: JSON.stringify({
          submission_id: submissionId,
          wallet_address: walletAddress,
        }),
      }
    ),

  approve: (id: string, submissionId: string, rating: number, message?: string, signedTxns?: string[]) =>
    apiFetch(`/api/bounties/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({
        submission_id: submissionId,
        rating: rating,
        message: message || "",
        signed_txns: signedTxns || [],
      }),
    }),

  reject: (id: string, submissionId: string, feedback: string) =>
    apiFetch(`/api/bounties/${id}/reject`, {
      method: "PUT",
      body: JSON.stringify({ submission_id: submissionId, feedback }),
    }),

  submit: async (id: string, megaNZLink: string, description: string, encryptionKeyFile: File) => {
    const formData = new FormData();
    formData.append("mega_nz_link", megaNZLink);
    formData.append("description", description);
    formData.append("encryption_key", encryptionKeyFile);
    const headers = await getAuthHeadersMultipart();
    return apiFetch<Submission>(`/api/bounties/${id}/submit`, {
      method: "POST",
      headers,
      body: formData,
    });
  },

  dispute: async (id: string, reason: string, evidenceFile?: File) => {
    const formData = new FormData();
    formData.append("reason", reason);
    if (evidenceFile) formData.append("evidence", evidenceFile);
    const headers = await getAuthHeadersMultipart();
    return apiFetch(`/api/bounties/${id}/dispute`, {
      method: "POST",
      headers,
      body: formData,
    });
  },

  refundExpired: (id: string) =>
    apiFetch(`/api/bounties/${id}/refund-expired`, { method: "POST" }),

  /** Freelancer lets go of bounty — forfeits claim, refunds creator */
  letGo: (id: string) =>
    apiFetch(`/api/bounties/${id}/letgo`, { method: "POST" }),

  /** Creator cancels bounty (only before any submissions) */
  cancel: (id: string) =>
    apiFetch(`/api/bounties/${id}/cancel`, { method: "POST" }),

  /** Creator rates a freelancer after approving (1-5 stars + optional message) */
  rate: (id: string, workerId: string, rating: number, message?: string) =>
    apiFetch(`/api/bounties/${id}/rate`, {
      method: "POST",
      body: JSON.stringify({ worker_id: workerId, stars: rating, comment: message }),
    }),

  submissions: (id: string) =>
    apiFetch<Submission[]>(`/api/bounties/${id}/submissions`),

  statusHistory: (id: string) =>
    apiFetch<BountyStatusUpdate[]>(`/api/bounties/${id}/status-history`),

  updateStatus: (id: string, status: string, note?: string) =>
    apiFetch(`/api/bounties/${id}/status-update`, {
      method: "POST",
      body: JSON.stringify({ status, note }),
    }),
};

// --- IPFS ---

export const ipfsApi = {
  pin: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const headers = await getAuthHeadersMultipart();
    return apiFetch<{ cid: string; hash: string }>("/api/ipfs/pin", {
      method: "POST",
      headers,
      body: formData,
    });
  },
};

// --- Health ---

export const healthApi = {
  check: () => apiFetch<{ status: string; algo_node: string }>("/health"),
};

// --- DAO ---

export interface Dispute {
  id: string;
  dispute_id: string;
  bounty_id: string;
  description: string;
  status: string;
  voting_deadline: string;
  created_at: string;
  freelancer_name: string;
  creator_name: string;
  bounty: { title: string; reward_algo: number; deadline: string };
  votes: { creator: number; freelancer: number; total: number };
  voting_active: boolean;
}

export const daoApi = {
  listActive: () => apiFetch<Dispute[]>("/api/dao/disputes"),
  getDisputeVotes: (disputeId: string) =>
    apiFetch<{ votes: DAOVote[]; tally: { creator: number; freelancer: number; total: number } }>(
      `/api/dao/disputes/${disputeId}/votes`
    ),
  castVote: (disputeId: string, vote: string, signedTxns: string[]) =>
    apiFetch(`/api/dao/disputes/${disputeId}/vote`, {
      method: "POST",
      body: JSON.stringify({ vote, signed_txns: signedTxns }),
    }),
  finalize: (disputeId: string, signedTxns: string[]) =>
    apiFetch(`/api/dao/disputes/${disputeId}/finalize`, {
      method: "POST",
      body: JSON.stringify({ signed_txns: signedTxns }),
    }),
};

// --- Dashboard ---

export interface DashboardStats {
  reputation_score: number;
  total_bounties_created: number;
  total_bounties_completed: number;
  total_earnings_algo: number;
  streak_count: number;
  avg_rating: number;
  total_ratings: number;
  active_bounties: number;
  active_submissions: number;
  total_submissions: number;
  approved_submissions: number;
  win_rate: number;
  unread_notifications: number;
  total_spent_algo: number;
  open_disputes: number;
  working_bounties: number;
  pending_acceptances: number;
  role: string;
}


export interface DashboardBounty {
  id: string;
  title: string;
  description: string;
  reward_algo: number;
  deadline: string;
  status: string;
  max_submissions: number;
  tags: string[];
  created_at: string;
  submission_count: number;
}

export interface WorkingBounty {
  id: string;
  title: string;
  description: string;
  reward_algo: number;
  deadline: string;
  status: string;
  max_submissions: number;
  submissions_remaining: number;
  tags: string[];
  created_at: string;
  submission_status: string;
  submitted_at: string;
  submission_id: string;
  submission_count: number;
  creator_username: string;
  rejection_feedback?: string;
  can_submit: boolean;
  can_resubmit: boolean;
  can_let_go: boolean;
  can_dispute: boolean;
  has_submitted: boolean;
}

export interface DashboardSubmission {
  id: string;
  bounty_id: string;
  status: string;
  feedback?: string;
  submitted_at: string;
  description?: string;
  bounty_title: string;
  bounty_reward: number;
  bounty_status: string;
  bounty_deadline: string;
}

export interface DashboardDispute {
  id: string;
  bounty_id: string;
  reason: string;
  status: string;
  created_at: string;
  evidence_ipfs_cid?: string;
  dao_vote_deadline?: string;
  auto_refund_after?: string;
  bounty_title: string;
  bounty_reward: number;
  initiated_by_username: string;
  votes: { approve: number; reject: number; total: number };
}

export interface BountyStatusUpdate {
  id: string;
  bounty_id: string;
  old_status?: string;
  new_status: string;
  note?: string;
  created_at: string;
  updated_by_username: string;
  updated_by_role: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  bounty_id?: string;
  is_read: boolean;
  created_at: string;
}

export const dashboardApi = {
  stats: () => apiFetch<DashboardStats>("/api/dashboard/stats"),
  myBounties: () => apiFetch<DashboardBounty[]>("/api/dashboard/my-bounties"),
  mySubmissions: () =>
    apiFetch<DashboardSubmission[]>("/api/dashboard/my-submissions"),
  workingBounties: () =>
    apiFetch<WorkingBounty[]>("/api/dashboard/working-bounties"),
  disputes: () => apiFetch<DashboardDispute[]>("/api/dashboard/disputes"),
  transactions: () => apiFetch<TransactionLogEntry[]>("/api/dashboard/transactions"),
};

export const notificationApi = {
  list: () => apiFetch<Notification[]>("/api/notifications"),
  markRead: () =>
    apiFetch("/api/notifications/read", { method: "PUT" }),
};

// --- Transaction Log Types (v3.1) ---

export interface TransactionLogEntry {
  id: string;
  bounty_id?: string;
  actor_id?: string;
  event: string;
  txn_id?: string;
  txn_note?: string;
  ipfs_metadata_cid?: string;
  ipfs_gateway_url?: string;
  amount_algo?: number;
  created_at: string;
  actor_username?: string;
  // Joined fields from admin endpoint
  bounty_title?: string;
  bounty_display_id?: string;
}

// --- DAO Court API types (v3.1) ---

export interface DAOVote {
  id: string;
  voter_id: string;
  vote: string;
  vote_txn_id?: string;
  voted_at: string;
  voter: { username: string; display_name?: string; avatar_url?: string };
}

// --- Bounty Acceptance Types (v3.2) ---

export interface BountyAcceptance {
  id: string;
  bounty_id: string;
  freelancer_id?: string;
  status: "pending" | "approved" | "rejected";
  message?: string;
  creator_note?: string;
  created_at: string;
  updated_at?: string;
  freelancer?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    reputation_score: number;
    bio?: string;
    total_bounties_completed: number;
    avg_rating: number;
    total_ratings: number;
  };
  // For dashboard views
  bounty_title?: string;
  bounty_reward?: number;
  bounty_deadline?: string;
  bounty_status?: string;
  bounty_tags?: string[];
  creator_username?: string;
  bounty?: {
    title: string;
    reward_algo: number;
    deadline: string;
    status: string;
    tags?: string[];
  };
}

// Add acceptance methods to bountyApi
export const acceptanceApi = {
  /** Freelancer requests to accept a bounty */
  accept: (bountyId: string, message?: string) =>
    apiFetch<{ acceptance_id: string }>(`/api/bounties/${bountyId}/accept`, {
      method: "POST",
      body: JSON.stringify({ message: message || "" }),
    }),

  /** Get acceptance requests for a bounty (creator sees all, freelancer sees own) */
  list: (bountyId: string) =>
    apiFetch<BountyAcceptance[]>(`/api/bounties/${bountyId}/acceptances`),

  /** Get current freelancer's acceptance status for a bounty */
  myStatus: (bountyId: string) =>
    apiFetch<BountyAcceptance | null>(`/api/bounties/${bountyId}/my-acceptance`),

  /** Creator reviews (approve/reject) a freelancer's acceptance */
  review: (
    bountyId: string,
    freelancerId: string,
    action: "approve" | "reject",
    walletAddress?: string,
    note?: string
  ) =>
    apiFetch<{ transactions?: string[]; freelancer_id?: string }>(`/api/bounties/${bountyId}/review-acceptance`, {
      method: "PUT",
      body: JSON.stringify({
        freelancer_id: freelancerId,
        action,
        wallet_address: walletAddress || "",
        note: note || "",
      }),
    }),

  /** Submit signed escrow transactions to confirm acceptance */
  confirm: (bountyId: string, freelancerId: string, signedTxns: string[], appId?: number) =>
    apiFetch<{ txn_id: string; app_id: number }>(`/api/bounties/${bountyId}/confirm-acceptance`, {
      method: "POST",
      body: JSON.stringify({
        freelancer_id: freelancerId,
        signed_txns: signedTxns,
        app_id: appId || 0,
      }),
    }),

  /** Dashboard: Creator gets pending acceptance requests */
  pendingForCreator: () =>
    apiFetch<BountyAcceptance[]>("/api/dashboard/pending-acceptances"),

  /** Dashboard: Freelancer gets their acceptance requests */
  myAcceptances: () =>
    apiFetch<BountyAcceptance[]>("/api/dashboard/my-acceptances"),
};

