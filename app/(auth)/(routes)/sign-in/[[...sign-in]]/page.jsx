"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  confirmPasswordReset,
  verifyPasswordResetCode
} from "firebase/auth";
import { app, sendResetPasswordEmail, sendVerificationEmail } from "../../../../../firebaseConfig";


export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState(""); // Add error state for forgot password

  // Password reset via link
  const [resetMode, setResetMode] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetConfirmMsg, setResetConfirmMsg] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detect password reset link
  useEffect(() => {
    const oobCode = searchParams?.get("oobCode");
    const mode = searchParams?.get("mode");
    if (mode === "resetPassword" && oobCode) {
      setResetMode(true);
      setResetCode(oobCode);
      // Optionally, verify code and get email
      const auth = getAuth(app);
      verifyPasswordResetCode(auth, oobCode)
        .then(email => setResetEmail(email))
        .catch(() => setResetError("Invalid or expired reset link."));
    }
  }, [searchParams]);

  // Handle password reset submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetConfirmMsg("");
    if (!resetNewPass || resetNewPass.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    try {
      const auth = getAuth(app);
      await confirmPasswordReset(auth, resetCode, resetNewPass);
      setResetConfirmMsg("Password has been reset! You can now sign in.");
      setTimeout(() => {
        router.replace("/sign-in");
      }, 2000);
    } catch (err) {
      setResetError("Failed to reset password. The link may be invalid or expired.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const auth = getAuth(app);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        setError("Your email is not verified. Please check your inbox.");
        setLoading(false);
        return;
      }
      router.push("/upload");
    } catch (err) {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/upload");
    } catch (err) {
      setError("Google login failed");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg("");
    setForgotError(""); // Reset error
    try {
      await sendResetPasswordEmail(forgotEmail);
      setForgotMsg("If an account with this email exists, a password reset link has been sent.");
    } catch (err) {
      // Show the actual error message for debugging
      if (err.code === "auth/too-many-requests") {
        setForgotMsg("Too many requests. Please try again later.");
      } else if (err.code === "auth/user-not-found") {
        setForgotMsg("No user found with this email address.");
      } else {
        setForgotMsg("Failed to send reset email. " + (err.message || "Please check your email address."));
      }
      setForgotError(err.message || String(err));
    }
  };


  const handleResendVerification = async () => {
    setError("");
    try {
      await sendVerificationEmail();
      setError("Verification email resent! Please check your inbox.");
    } catch (err) {
      setError("Failed to resend verification email.");
    }
  };

  // UI rendering
  if (resetMode) {
    // Show password reset form
    return (
      <div className="flex min-h-screen items-center justify-center bg-cover bg-center relative" style={{ backgroundImage: "url('/bg.png')" }}>
        <div className="z-10 w-full max-w-sm md:max-w-md p-8 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl">
          <div className="text-center mb-6">
            <Image src="/dark.svg" alt="Logo" width={200} height={200} className="mx-auto mb-4 rounded-xl" />
            <h2 className="text-xl font-semibold text-white">Reset Your Password</h2>
            <p className="text-sm text-white/70">Set a new password for your account</p>
          </div>
          {resetError && <div className="text-red-500 text-center mb-4 text-sm">{resetError}</div>}
          {resetConfirmMsg ? (
            <div className="text-green-500 text-center mb-4 text-sm">{resetConfirmMsg}</div>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="New Password"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                value={resetNewPass}
                onChange={e => setResetNewPass(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-white/20 text-white font-medium py-3 rounded-xl hover:bg-white/30 transition"
              >
                Set New Password
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center relative" style={{ backgroundImage: "url('/bg.png')" }}>
      <div className="z-10 w-full max-w-sm md:max-w-md p-8 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl">
        <div className="text-center mb-6">
          <Image src="/dark.svg" alt="Logo" width={200} height={200} className="mx-auto mb-4 rounded-xl" />
          <h2 className="text-xl font-semibold text-white">Welcome Back</h2>
          <p className="text-sm text-white/70">Sign in to continue to your account</p>
        </div>

        {error && <div className="text-red-500 text-center mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 pr-12"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90"
              style={{ transform: "translateY(-50%)" }}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                // Eye-off SVG
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.236.938-4.675m1.662 2.337A9.956 9.956 0 0112 5c5.523 0 10 4.477 10 10 0 1.657-.336 3.236-.938 4.675m-1.662-2.337A9.956 9.956 0 0112 19c-1.657 0-3.236-.336-4.675-.938m2.337-1.662A9.956 9.956 0 015 12c0-1.657.336-3.236.938-4.675m2.337 1.662A9.956 9.956 0 0112 5c1.657 0 3.236.336 4.675.938m-2.337 1.662A9.956 9.956 0 0119 12c0 1.657-.336 3.236-.938 4.675m-2.337-1.662A9.956 9.956 0 0112 19c-1.657 0-3.236-.336-4.675-.938" />
                  <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} />
                </svg>
              ) : (
                // Eye SVG
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.458 12C2.732 7.943 6.523 5 12 5c5.477 0 9.268 2.943 10.542 7-1.274 4.057-5.065 7-10.542 7-5.477 0-9.268-2.943-10.542-7z" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} />
                </svg>
              )}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-white/70 hover:underline"
              onClick={() => { setShowForgot(true); setForgotEmail(""); setForgotMsg(""); }}
              tabIndex={0}
            >
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-white/20 text-white font-medium py-3 rounded-xl hover:bg-white/30 transition"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <div className="flex items-center gap-2 my-6">
          <div className="flex-grow h-px bg-white/20" />
          <span className="text-white/50 text-sm">or</span>
          <div className="flex-grow h-px bg-white/20" />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black hover:bg-gray-100 transition shadow"
          >
            <Image src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Google_Favicon_2025.svg" alt="Google" width={20} height={20} />
            <span className="text-sm font-medium">Sign in with Google</span>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-white/60">
          Don't have an account?
          <Link href="/sign-up?redirect_url=/upload" className="text-white ml-1 hover:underline">Sign up</Link>
        </p>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                onClick={() => setShowForgot(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-3 text-gray-800">Reset Password</h3>
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border rounded text-gray-800"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  Send Reset Email
                </button>
              </form>
              {forgotMsg && (
                <div className="mt-3 text-sm text-center text-gray-700">{forgotMsg}</div>
              )}
              {forgotError && (
                <div className="mt-2 text-xs text-center text-red-500">{forgotError}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}