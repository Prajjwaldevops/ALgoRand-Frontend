"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const clerk = useClerk();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await clerk.client.signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await clerk.client.signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        setVerified(true);
        setTimeout(() => router.push("/bounties"), 2000);
      } else {
        console.error("Incomplete password reset", result);
        setError("Password reset incomplete");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to verify code and set new password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
      <div className="max-w-md w-full px-4 text-center">
        <ScrollReveal>
          <div className="mb-6 flex justify-start">
            <Link 
              href="/auth" 
              className="inline-flex items-center text-sm font-medium text-vault-text-muted hover:text-white transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Sign In
            </Link>
          </div>

          <h1 className="text-3xl font-bold font-[var(--font-heading)] mb-2 text-white">
            Reset Password
          </h1>
          <p className="text-vault-text-secondary text-sm mb-8">
            {submitted ? "Enter the code sent to your email and your new password" : "Enter your email to receive a password reset code"}
          </p>

          <Card hover={false} className="p-8 text-left">
            {verified ? (
              <div className="text-center py-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-vault-green/20 flex items-center justify-center mb-4 text-vault-green">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Password Reset</h3>
                <p className="text-sm text-vault-text-muted">
                  Your password has been reset successfully. Redirecting...
                </p>
              </div>
            ) : submitted ? (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-vault-text-muted">Verification Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="Enter the code sent to your email"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-vault-text-muted">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Enter new password"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-vault-red/10 border border-vault-red/20 rounded-lg text-vault-red text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-6"
                  loading={loading}
                >
                  Reset Password
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-vault-text-muted">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your registered email"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-vault-red/10 border border-vault-red/20 rounded-lg text-vault-red text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-6"
                  loading={loading}
                >
                  Send Reset Code
                </Button>
              </form>
            )}
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
}
