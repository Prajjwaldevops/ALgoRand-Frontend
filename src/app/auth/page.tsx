"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi, Profile } from "@/lib/api";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export default function AuthPage() {
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();
  const router = useRouter();
  const { user: authUser, loading: profileLoading, refreshUser, setUserDirect } = useAuth();
  const clerk = useClerk();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [identifier, setIdentifier] = useState(""); // email or username for login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"freelancer" | "creator">("freelancer");

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [code2FA, setCode2FA] = useState("");

  // Redirect authenticated users away from the auth page.
  // Wait until both Clerk AND our profile are fully loaded before redirecting.
  // This prevents flickering: if we redirect while loading=true, ProtectedRoute
  // shows a skeleton and may bounce back to /auth.
  useEffect(() => {
    if (!clerkLoaded || verifying || verifying2FA) return;
    if (isSignedIn && !profileLoading && authUser) {
      router.replace("/dashboard");
    }
  }, [clerkLoaded, isSignedIn, profileLoading, authUser, verifying, verifying2FA, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerk.loaded) return;

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        let result = await clerk.client.signIn.create({
          identifier: identifier, // accepts email or username
          password,
        });

        // Handle multi-step sign-in (Clerk may require explicit first-factor
        // attempt when bot protection / CAPTCHA is enabled)
        if (result.status === "needs_first_factor") {
          result = await result.attemptFirstFactor({
            strategy: "password",
            password,
          });
        }

        if (result.status === "complete") {
          await clerk.setActive({ session: result.createdSessionId });
          // Do NOT call refreshUser() here — Clerk's JWT isn't immediately
          // available via getToken() right after setActive(), so it returns
          // null/stale → backend 401/403 → user=null → ProtectedRoute bounces
          // to /auth (the flicker bug).
          // AuthContext's useEffect watches clerkUser and fires refreshUser()
          // automatically once Clerk fully propagates the new session.
          router.replace("/dashboard");
        } else if (result.status === "needs_second_factor") {
          setVerifying2FA(true);
        } else {
          setError("Sign-in could not be completed. Please try again.");
        }
      } else {
        const result = await clerk.client.signUp.create({
          emailAddress: email,
          password,
          username: username || email.split("@")[0].replace(/[^a-zA-Z0-9]/g, ""),
          firstName: firstName,
          lastName: lastName,
        });

        await result.prepareEmailAddressVerification({ strategy: "email_code" });
        setVerifying(true);
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[]; message?: string };
      console.error(err);
      setError(clerkErr.errors?.[0]?.message || clerkErr.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerk.loaded) return;
    setLoading(true);
    setError(null);

    try {
      const result = await clerk.client.signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });

        // Sync custom username, role, and name to our backend immediately.
        // This MUST complete before any background refreshUser() runs,
        // otherwise the profile gets created with default "freelancer" role.
        const syncRes = await authApi.sync(
          email,
          username || email.split("@")[0],
          role,
          firstName,
          lastName
        );

        // Use setUserDirect to immediately set the correct profile (with role)
        // and invalidate any stale background refreshes.
        if (syncRes.success && syncRes.data) {
          setUserDirect(syncRes.data as Profile);
        } else {
          // Sync succeeded on backend but response parsing issue — refresh from DB
          await refreshUser();
        }

        router.push("/auth/link-wallet");
      } else {
        console.error("Sign up verification incomplete", result);
        setError("Verification failed, try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[]; message?: string };
      console.error(err);
      setError(clerkErr.errors?.[0]?.message || clerkErr.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerk.loaded) return;
    setLoading(true);
    setError(null);

    try {
      const validFactors = clerk.client.signIn.supportedSecondFactors || [];
      const factor = validFactors[0];
      if (!factor) throw new Error("No 2FA methods available");

      const result = await clerk.client.signIn.attemptSecondFactor({
        strategy: factor.strategy as any,
        code: code2FA,
      });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        router.replace("/dashboard");
      } else {
        console.error("2FA verification incomplete", result);
        setError("Verification failed, try again.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[]; message?: string };
      console.error(err);
      setError(clerkErr.errors?.[0]?.message || clerkErr.message || "Invalid 2FA code.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying2FA) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <ScrollReveal>
            <h1 className="text-3xl font-bold mb-2 text-white">Two-Factor Authentication</h1>
            <p className="text-vault-text-secondary text-sm mb-8">
              Enter the 2FA code to securely log in
            </p>
            <Card hover={false} className="p-8 text-left">
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-vault-text-muted">Authentication Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="p-3 bg-vault-red/10 border border-vault-red/20 rounded-lg text-vault-red text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" variant="primary" className="w-full mt-6" loading={loading}>
                  Verify Code
                </Button>
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    className="text-sm text-vault-text-muted hover:text-white transition-colors"
                    onClick={() => {
                      setVerifying2FA(false);
                      setError(null);
                      setCode2FA("");
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <ScrollReveal>
            <h1 className="text-3xl font-bold mb-2 text-white">Verify Email</h1>
            <p className="text-vault-text-secondary text-sm mb-8">
              We sent a verification code to {email}
            </p>
            <Card hover={false} className="p-8 text-left">
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-vault-text-muted">Verification Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="p-3 bg-vault-red/10 border border-vault-red/20 rounded-lg text-vault-red text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" variant="primary" className="w-full mt-6" loading={loading}>
                  Verify Code
                </Button>
              </form>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
      <div className="max-w-md w-full px-4 text-center">
        <ScrollReveal>
          <h1 className="text-3xl font-bold font-[var(--font-heading)] mb-2 mt-4 text-white">
            {isLogin ? "Welcome Back" : "Join "}
            {!isLogin && <span className="gradient-text">BountyVault</span>}
          </h1>
          <p className="text-vault-text-secondary text-sm mb-8">
            {isLogin
              ? "Sign in to manage your bounties and submissions"
              : "Create an account to start earning or creating bounties"}
          </p>

          <Card hover={false} className="p-8 text-left">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  {/* First Name & Last Name side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-vault-text-muted">First Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        required={!isLogin}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-vault-text-muted">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-vault-text-muted">Username</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe"
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-vault-text-muted">I am a</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole("freelancer")}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          role === "freelancer"
                            ? "bg-vault-cyan/15 border-vault-cyan text-vault-cyan shadow-[0_0_15px_rgba(0,210,211,0.15)]"
                            : "bg-vault-bg border-vault-border text-vault-text-muted hover:bg-vault-white/5"
                        }`}
                      >
                        🛠️ Freelancer
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("creator")}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          role === "creator"
                            ? "bg-vault-purple/15 border-vault-purple text-vault-purple-light shadow-[0_0_15px_rgba(124,92,252,0.15)]"
                            : "bg-vault-bg border-vault-border text-vault-text-muted hover:bg-vault-white/5"
                        }`}
                      >
                        🎯 Creator
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-vault-text-muted">
                  {isLogin ? "Email or Username" : "Email"}
                </label>
                {isLogin ? (
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@email.com or username"
                    required
                  />
                ) : (
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-vault-text-muted">Password</label>
                </div>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 bg-vault-bg/50 border border-vault-border rounded-xl text-sm text-vault-text focus:outline-none focus:border-vault-purple transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
              <div id="clerk-captcha"></div>
            </form>

            <div className="mt-6 text-center text-sm text-vault-text-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-vault-purple-light hover:underline font-medium"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </div>
          </Card>
        </ScrollReveal>
      </div>
    </div>
  );
}
