"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { app } from "../../../../../firebaseConfig";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (fullName) {
        await updateProfile(user, { displayName: fullName });
      }
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        firstName: fullName.split(" ")[0] || "",
        lastName: fullName.split(" ")[1] || "",
        createdAt: new Date(),
        role: "user"
      });
      // Log register activity
      await addDoc(collection(db, "activityLogs"), {
        type: "register",
        userId: user.uid,
        email: user.email,
        timestamp: serverTimestamp(),
      });
      router.push("/sign-in?redirect_url=/upload");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError(
          <>
            <span>
              <b>This email is already registered.</b> <br />
              <span className="text-gray-300">
                <span>
                  <span className="inline-block mr-1">👉</span>
                  <Link href="/sign-in?redirect_url=/upload" className="text-blue-200 underline hover:text-blue-400">
                    Sign in with your existing account
                  </Link>
                </span>
                <br />
                <span>
                  Or&nbsp;
                  <span className="text-blue-200 underline hover:text-blue-400 cursor-pointer"
                    onClick={() => setEmail("")}
                  >
                    use another email
                  </span>
                </span>
              </span>
            </span>
          </>
        );
      } else {
        setError("Signup failed: " + (err?.message || ""));
      }
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ")[1] || "",
          createdAt: new Date(),
          role: "user"
        });
      }
      router.push("/upload");
    } catch (err) {
      if (err.code === "auth/account-exists-with-different-credential" || err.code === "auth/email-already-in-use") {
        setError(
          <>
            <span>
              <b>This email is already registered with another provider.</b> <br />
              <span className="text-gray-300">
                <span>
                  <span className="inline-block mr-1">👉</span>
                  <Link href="/sign-in?redirect_url=/upload" className="text-blue-200 underline hover:text-blue-400">
                    Sign in with your existing account
                  </Link>
                </span>
                <br />
                <span>
                  Or&nbsp;
                  <span className="text-blue-200 underline hover:text-blue-400 cursor-pointer"
                    onClick={() => setEmail("")}
                  >
                    use another email
                  </span>
                </span>
              </span>
            </span>
          </>
        );
      } else {
        setError("Social signup failed: " + (err?.message || ""));
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center relative" style={{ backgroundImage: "url('/bg.png')" }}>
      <div className="z-10 w-full max-w-sm md:max-w-md p-8 bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl">
        <div className="text-center mb-6">
          <Image src="/dark.svg" alt="Logo" width={200} height={200} className="mx-auto mb-4 rounded-xl" />
          <h2 className="text-xl font-semibold text-white">Create an Account</h2>
          <p className="text-sm text-white/70">Join CloudSharing</p>
        </div>

        {error && (
          <div className="text-red-500 text-center mb-4 text-sm">
            {typeof error === "string" ? error : error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
          />
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
              style={{ transform: "translateY(-50%)" }}              onClick={() => setShowPassword((v) => !v)}
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
          <button
            type="submit"
            className="w-full bg-white/20 text-white font-medium py-3 rounded-xl hover:bg-white/30 transition"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Continue"}
          </button>
        </form>

        <div className="flex items-center gap-2 my-6">
          <div className="flex-grow h-px bg-white/20" />
          <span className="text-white/50 text-sm">or</span>
          <div className="flex-grow h-px bg-white/20" />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black hover:bg-gray-100 transition shadow"
          >
            <Image src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Google_Favicon_2025.svg" alt="Google" width={20} height={20} />
            <span className="text-sm font-medium">Sign up with Google</span>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-white/60">
          Already have an account?
          <Link href="/sign-in?redirect_url=/upload" className="text-white ml-1 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
