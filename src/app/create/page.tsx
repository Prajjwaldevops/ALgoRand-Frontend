"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bountyApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Zap, ArrowRight, ArrowLeft, X, Plus } from "lucide-react";

export default function CreateBountyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    reward_algo: 1,
    deadline: "",
    tags: [] as string[],
    max_submissions: 5,
  });
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const [loadingStep, setLoadingStep] = useState("");

  const titleValid = form.title.trim().length >= 5;
  const descValid = form.description.trim().length >= 20;

  const handleSubmit = async () => {
    if (!titleValid) {
      setError("Title must be at least 5 characters long.");
      return;
    }
    if (!descValid) {
      setError("Description must be at least 20 characters long.");
      return;
    }
    if (!form.deadline) {
      setError("Please set a deadline.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await bountyApi.create({
        ...form,
        deadline: new Date(form.deadline).toISOString(),
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to create bounty. Make sure you are logged in.");
      }

      // Redirect to Creator Dashboard on success
      router.push("/dashboard/creator");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Min deadline: 1 hour from now
  const minDeadline = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white text-left placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c]/40 transition-colors";

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="mb-10">
            <h1 className="text-section-title mb-2">
              Create a <span className="text-[#ef233c]">Bounty</span>
            </h1>
            <p className="text-section-sub">
              Define your task and set the reward.
            </p>
          </div>
        </ScrollReveal>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s
                    ? "bg-[#ef233c] text-white shadow-lg shadow-[#ef233c]/30"
                    : "bg-white/5 border border-white/10 text-zinc-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-px transition-colors ${
                    step > s ? "bg-[#ef233c]" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Details */}
        {step === 1 && (
          <ScrollReveal>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-semibold font-[var(--font-heading)] text-white">
                Bounty Details
              </h2>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Title</label>
                <input
                  id="bounty-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Build a DeFi Dashboard"
                  className={inputClass}
                  maxLength={300}
                  minLength={5}
                />
                {form.title.length > 0 && form.title.trim().length < 5 && (
                  <p className="text-xs text-amber-400 mt-1">Title must be at least 5 characters ({form.title.trim().length}/5)</p>
                )}
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Description</label>
                <textarea
                  id="bounty-description"
                  dir="ltr"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the task requirements in detail..."
                  className={`${inputClass} resize-none h-32`}
                  minLength={20}
                />
                {form.description.length > 0 && form.description.trim().length < 20 && (
                  <p className="text-xs text-amber-400 mt-1">Description must be at least 20 characters ({form.description.trim().length}/20)</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Reward (ALGO)
                  </label>
                  <input
                    id="bounty-reward"
                    type="number"
                    value={form.reward_algo}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        reward_algo: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    min={1}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">
                    Max Submissions
                  </label>
                  <input
                    id="bounty-max-subs"
                    type="number"
                    value={form.max_submissions}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        max_submissions: Math.min(50, Math.max(1, Number(e.target.value))),
                      }))
                    }
                    min={1}
                    max={50}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Deadline</label>
                <input
                  id="bounty-deadline"
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  min={minDeadline}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="primary"
                  onClick={() => setStep(2)}
                  disabled={!titleValid || !descValid || !form.deadline}
                >
                  Next: Tags
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Step 2: Tags */}
        {step === 2 && (
          <ScrollReveal>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-semibold font-[var(--font-heading)] text-white">
                Add Tags
              </h2>
              <p className="text-sm text-zinc-400">
                Help workers find your bounty with relevant tags.
              </p>

              <div className="flex gap-2">
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="e.g., react, solidity, design"
                  className={`flex-1 ${inputClass}`}
                />
                <Button variant="secondary" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ef233c]/10 text-red-300 text-xs font-medium border border-[#ef233c]/20"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Next: Review
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <ScrollReveal>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-semibold font-[var(--font-heading)] text-white">
                Review & Create
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-500">Title</span>
                  <span className="font-medium text-right max-w-[60%] text-white">{form.title}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-500">Reward</span>
                  <span className="font-bold text-[#ef233c]">{form.reward_algo} ALGO</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-500">Deadline</span>
                  <span className="text-white">{new Date(form.deadline).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-500">Max Submissions</span>
                  <span className="text-white">{form.max_submissions}</span>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex justify-between items-start py-2 border-b border-white/5">
                    <span className="text-zinc-500">Tags</span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                      {form.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-[#ef233c]/10 text-red-300 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-900/20 border border-red-800/30 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={loading}
                    id="create-bounty-submit"
                  >
                    <Zap className="w-4 h-4" />
                    Create Bounty
                  </Button>
                  {loadingStep && (
                    <span className="text-xs text-[#ef233c] font-medium animate-pulse">
                      {loadingStep}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
