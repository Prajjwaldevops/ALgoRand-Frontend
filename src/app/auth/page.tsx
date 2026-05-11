"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi, Profile } from "@/lib/api";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

function AuthPageContent() {
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";
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
      router.replace(redirectUrl);
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
          router.replace(redirectUrl);
        } else if (result.status === "needs_second_factor") {
          // Prepare the second factor — this triggers the OTP email delivery
          const secondFactors = result.supportedSecondFactors || [];
          const emailFactor = secondFactors.find(
            (f: { strategy: string }) => f.strategy === "email_code"
          );
          const phoneFactor = secondFactors.find(
            (f: { strategy: string }) => f.strategy === "phone_code"
          );
          const totpFactor = secondFactors.find(
            (f: { strategy: string }) => f.strategy === "totp"
          );

          if (emailFactor) {
            await result.prepareSecondFactor({ strategy: "email_code" });
          } else if (phoneFactor) {
            await result.prepareSecondFactor({ strategy: "phone_code" });
          }
          // TOTP (authenticator app) doesn't need prepare — user already has the code

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
      const emailFactor = validFactors.find(
        (f: { strategy: string }) => f.strategy === "email_code"
      );
      const phoneFactor = validFactors.find(
        (f: { strategy: string }) => f.strategy === "phone_code"
      );
      const totpFactor = validFactors.find(
        (f: { strategy: string }) => f.strategy === "totp"
      );

      // Determine which strategy to attempt
      let strategy: string;
      if (emailFactor) {
        strategy = "email_code";
      } else if (phoneFactor) {
        strategy = "phone_code";
      } else if (totpFactor) {
        strategy = "totp";
      } else {
        throw new Error("No 2FA methods available");
      }

      const result = await clerk.client.signIn.attemptSecondFactor({
        strategy: strategy as any,
        code: code2FA,
      });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        router.replace(redirectUrl);
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

  const handleResend2FA = async () => {
    if (!clerk.loaded) return;
    setError(null);
    try {
      const validFactors = clerk.client.signIn.supportedSecondFactors || [];
      const emailFactor = validFactors.find(
        (f: { strategy: string }) => f.strategy === "email_code"
      );
      const phoneFactor = validFactors.find(
        (f: { strategy: string }) => f.strategy === "phone_code"
      );

      if (emailFactor) {
        await clerk.client.signIn.prepareSecondFactor({ strategy: "email_code" });
        setError(null);
        alert("A new verification code has been sent to your email.");
      } else if (phoneFactor) {
        await clerk.client.signIn.prepareSecondFactor({ strategy: "phone_code" });
        alert("A new verification code has been sent to your phone.");
      } else {
        setError("Your 2FA method uses an authenticator app — check your app for the code.");
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[]; message?: string };
      setError(clerkErr.errors?.[0]?.message || "Failed to resend code.");
    }
  };

  // Shared input class
  const inputClass = "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#ef233c] transition-colors placeholder:text-zinc-600";

  if (verifying2FA) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center">
          <ScrollReveal>
            <h1 className="text-3xl font-bold mb-2 text-white font-[var(--font-heading)]">Two-Factor Authentication</h1>
            <p className="text-zinc-400 text-sm mb-8">
              Enter the verification code sent to your email or from your authenticator app
            </p>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-8 text-left">
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-500">Authentication Code</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" variant="primary" className="w-full mt-6" loading={loading}>
                  Verify Code
                </Button>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    className="text-sm text-[#ef233c] hover:underline font-medium"
                    onClick={handleResend2FA}
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
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
            </div>
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
            <h1 className="text-3xl font-bold mb-2 text-white font-[var(--font-heading)]">Verify Email</h1>
            <p className="text-zinc-400 text-sm mb-8">
              We sent a verification code to {email}
            </p>
            <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-8 text-left">
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-500">Verification Code</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" variant="primary" className="w-full mt-6" loading={loading}>
                  Verify Code
                </Button>
              </form>
            </div>
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
            {!isLogin && <span className="text-[#ef233c]">BountyVault</span>}
          </h1>
          <p className="text-zinc-400 text-sm mb-8">
            {isLogin
              ? "Sign in to manage your bounties and submissions"
              : "Create an account to start earning or creating bounties"}
          </p>

          <div className="border border-white/10 bg-zinc-900/50 rounded-xl p-8 text-left">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  {/* First Name & Last Name side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-500">First Name</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        required={!isLogin}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-500">Last Name</label>
                      <input
                        type="text"
                        className={inputClass}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required={!isLogin}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-500">Username</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe"
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-500">I am a</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRole("freelancer")}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          role === "freelancer"
                            ? "bg-[#ef233c]/15 border-[#ef233c] text-[#ef233c] shadow-[0_0_15px_rgba(239,35,60,0.15)]"
                            : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10"
                        }`}
                      >
                        🛠️ Freelancer
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("creator")}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          role === "creator"
                            ? "bg-[#ef233c]/15 border-[#ef233c] text-[#ef233c] shadow-[0_0_15px_rgba(239,35,60,0.15)]"
                            : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10"
                        }`}
                      >
                        🎯 Creator
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500">
                  {isLogin ? "Email or Username" : "Email"}
                </label>
                {isLogin ? (
                  <input
                    type="text"
                    className={inputClass}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@email.com or username"
                    required
                  />
                ) : (
                  <input
                    type="email"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-500">Password</label>
                </div>
                <input
                  type="password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">
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

            <div className="mt-6 text-center text-sm text-zinc-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-[#ef233c] hover:underline font-medium"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ef233c] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
