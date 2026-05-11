"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Wallet, ArrowRight, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function LinkWalletPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { accountAddress, connectWallet, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLinkWallet = async () => {
    if (!accountAddress) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.updateProfile({ wallet_address: accountAddress });
      if (res.success) {
        await refreshUser(); // sync context
        router.push("/bounties");
      } else {
        setError(res.error || "Failed to link wallet");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
      <div className="max-w-md w-full px-4 text-center">
        <ScrollReveal>
          <div className="w-16 h-16 mx-auto bg-[#ef233c]/20 rounded-full flex items-center justify-center mb-6">
            <Wallet className="w-8 h-8 text-[#ef233c]" />
          </div>
          <h1 className="text-3xl font-bold font-[var(--font-heading)] mb-2 text-white">
            Link Your Wallet
          </h1>
          <p className="text-zinc-400 text-sm mb-8">
            BountyVault requires an Algorand wallet connected to your profile to interact with trustless escrows and receive payouts.
          </p>

          <Card hover={false} className="p-8">
            {error && (
              <div className="p-3 mb-6 bg-red-500/10 border border-red-800/20 rounded-lg text-red-400 text-sm text-left">
                {error}
              </div>
            )}

            {!isConnected || !accountAddress ? (
              <div className="space-y-4">
                <Button variant="primary" className="w-full py-6 text-lg" onClick={() => connectWallet()}>
                  Connect Pera Wallet
                </Button>
                <p className="text-xs text-zinc-500 mt-4">
                  By connecting a wallet, you agree to BountyVault's Terms of Service.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-white/5 border border-vault-green/30 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="text-left overflow-hidden">
                    <p className="text-xs text-zinc-500">Wallet Connected</p>
                    <p className="text-sm font-mono text-emerald-400 font-medium truncate">
                      {accountAddress}
                    </p>
                  </div>
                </div>

                <Button 
                  variant="primary" 
                  className="w-full" 
                  onClick={handleLinkWallet}
                  loading={loading}
                >
                  Confirm & Link to Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>

          <div className="mt-8">
            <button 
              onClick={() => router.push("/bounties")}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
