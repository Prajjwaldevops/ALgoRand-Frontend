"use client";

import { useEffect, useState, useCallback } from "react";
import {
  dashboardApi,
  bountyApi,
  type WorkingBounty,
  type BountyStatusUpdate,
} from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Activity, Clock, ArrowRight, Send, User, CheckCircle } from "lucide-react";

export default function FreelancerStatusPage() {
  const [bounties, setBounties] = useState<WorkingBounty[]>([]);
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<BountyStatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState("in_progress");
  const [newNote, setNewNote] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchBounties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.workingBounties();
      if (res.success && res.data) {
        setBounties(res.data);
        if (res.data.length > 0) setSelectedBountyId(res.data[0].id);
      }
    } catch { /* defaults */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatusUpdates = useCallback(async (bountyId: string) => {
    setUpdatesLoading(true);
    try {
      const res = await bountyApi.statusHistory(bountyId);
      if (res.success && res.data) setStatusUpdates(res.data);
      else setStatusUpdates([]);
    } catch { setStatusUpdates([]); } finally {
      setUpdatesLoading(false);
    }
  }, []);

  useEffect(() => { fetchBounties(); }, [fetchBounties]);
  useEffect(() => {
    if (selectedBountyId) fetchStatusUpdates(selectedBountyId);
  }, [selectedBountyId, fetchStatusUpdates]);

  const handleSubmitUpdate = async () => {
    if (!selectedBountyId || !newNote.trim()) return;
    setSubmitting(true);
    setSuccessMsg("");
    try {
      const res = await bountyApi.updateStatus(selectedBountyId, newStatus, newNote);
      if (res.success) {
        setSuccessMsg("Status update posted!");
        setNewNote("");
        fetchStatusUpdates(selectedBountyId);
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch { /* error */ } finally {
      setSubmitting(false);
    }
  };

  const statusOptions = [
    { value: "in_progress", label: "In Progress" },
    { value: "submitted", label: "Submitted" },
    { value: "needs_review", label: "Needs Review" },
    { value: "blocked", label: "Blocked" },
    { value: "completed", label: "Completed" },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-4">
        <div className="h-12 bg-white/5 rounded-xl w-1/3" />
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <ScrollReveal>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#ef233c]" /> Bounty Status
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Post progress updates on your active bounties
        </p>
      </ScrollReveal>

      {bounties.length === 0 ? (
        <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-10 text-center rounded-2xl">
          <Activity className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No active bounties</h3>
          <p className="text-sm text-zinc-400">Submit work on a bounty to start posting status updates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bounty Selector */}
          <ScrollReveal delay={0.1}>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-500 mb-3">Select Bounty</h3>
              {bounties.map((bounty) => (
                <button
                  key={bounty.id}
                  onClick={() => setSelectedBountyId(bounty.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all text-sm ${
                    selectedBountyId === bounty.id
                      ? "border border-white/10 bg-zinc-900/50 backdrop-blur-sm border-[#ef233c]/30 bg-vault-cyan/5"
                      : "glass hover:bg-white/5"
                  }`}
                >
                  <p className="font-medium line-clamp-1">{bounty.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    by {bounty.creator_username} · <span className="capitalize">{bounty.submission_status}</span>
                  </p>
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* Status Update Form + Timeline */}
          <ScrollReveal delay={0.15} className="lg:col-span-2 space-y-6">
            {/* Post Update Form */}
            <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#ef233c]" /> Post Status Update
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewStatus(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          newStatus === opt.value
                            ? "bg-vault-cyan/20 text-[#ef233c] border border-[#ef233c]/30"
                            : "glass text-zinc-500 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Update Note</label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Describe your progress..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-vault-cyan transition-colors resize-none"
                  />
                </div>
                {successMsg && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> {successMsg}
                  </div>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitUpdate}
                  loading={submitting}
                  disabled={!newNote.trim()}
                >
                  <Send className="w-4 h-4" /> Post Update
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="border border-white/10 bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#ef233c]" /> Update History
              </h3>
              {updatesLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl" />
                  ))}
                </div>
              ) : statusUpdates.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">No updates yet. Post your first status update above.</p>
                </div>
              ) : (
                <div className="space-y-4 relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-vault-border" />
                  {statusUpdates.map((update, i) => (
                    <div key={update.id} className="relative flex items-start gap-4 pl-8" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full bg-vault-cyan border-2 border-vault-bg" />
                      <div className="flex-1 glass p-3 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs font-medium">{update.updated_by_username}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#ef233c]/10 text-[#ef233c] capitalize">{update.updated_by_role}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">{new Date(update.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {update.old_status && (
                            <>
                              <span className="px-2 py-0.5 rounded bg-white/5 capitalize">{update.old_status.replace(/_/g, " ")}</span>
                              <ArrowRight className="w-3 h-3 text-zinc-500" />
                            </>
                          )}
                          <span className="px-2 py-0.5 rounded bg-[#ef233c]/10 text-[#ef233c] capitalize font-medium">{update.new_status.replace(/_/g, " ")}</span>
                        </div>
                        {update.note && <p className="text-xs text-zinc-400 mt-2 italic">&quot;{update.note}&quot;</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      )}
    </div>
  );
}
