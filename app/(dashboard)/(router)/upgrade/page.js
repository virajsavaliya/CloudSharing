// File: app/(dashboard)/(router)/upgrade/page.js

"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { app } from "../../../../firebaseConfig";
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import Link from "next/link";
import Image from "next/image";
import { Check, History } from "lucide-react";
import PaymentModal from "./_components/PaymentModal";
import PaymentStatus from "./_components/PaymentStatus";
import PaymentHistoryModal from "./_components/PaymentHistoryModal";

// ✅ Helper function to calculate price
const calculatePrice = (basePrice, duration) => {
  const inrPrice = basePrice * 83;
  switch (duration) {
    case "3months":
      return Math.round(inrPrice * 3 * 0.85);
    case "annual":
      return Math.round(inrPrice * 12 * 0.7);
    default:
      return Math.round(inrPrice);
  }
};

// ✅ Plan data
const plans = [
  {
    name: "Free",
    basePrice: 0,
    features: ["50MB file size limit", "Basic sharing", "Email support"],
    storageLimit: "1 GB",
  },
  {
    name: "Pro",
    basePrice: 9.99,
    features: [
      "2GB file size limit",
      "Password protection",
      "Priority support",
    ],
    storageLimit: "100 GB",
  },
  {
    name: "Premium",
    basePrice: 19.99,
    features: [
      "Unlimited file size",
      "Advanced analytics",
      "24/7 support",
    ],
    storageLimit: "500 GB",
  },
];

const planRank = { Free: 0, Pro: 1, Premium: 2 };
const durationRank = { monthly: 1, "3months": 2, annual: 3 };

function UpgradePage({ user }) {
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [currentDuration, setCurrentDuration] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duration, setDuration] = useState("monthly");
  const [upgradeError, setUpgradeError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const db = getFirestore(app);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Update Firestore after payment
  const handleFirebaseUpdate = async (plan, dur) => {
    if (!plan || !dur || !user) {
      console.error("[UpgradePage] Missing required data for Firebase update:", {
        plan, dur, userId: user?.uid
      });
      return;
    }
    try {
      console.log("[UpgradePage] Updating Firestore subscription:", {
        plan, duration: dur, userId: user.uid
      });
      
      await setDoc(
        doc(db, "userSubscriptions", user.uid),
        {
          plan,
          duration: dur,
          userId: user.uid,
          userEmail: user.email,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      
      console.log("[UpgradePage] Successfully updated subscription in Firestore");
      setCurrentPlan(plan);
      setCurrentDuration(dur);
    } catch (error) {
      console.error("[UpgradePage] Error upgrading plan:", error);
      setUpgradeError("Failed to update your plan. Please contact support.");
    }
  };

  // ✅ Verify payment after redirect
  useEffect(() => {
    const orderId = searchParams.get("order_id");
    console.log("[UpgradePage] Checking for order_id in URL params:", orderId);
    
    if (orderId) {
      setVerifying(true);
      const verifyPayment = async () => {
        try {
          console.log("[UpgradePage] Starting payment verification for order:", orderId);
          
          const res = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: orderId }),
          });
          
          console.log("[UpgradePage] Verify payment response status:", res.status);
          
          const result = await res.json();
          console.log("[UpgradePage] Verify payment result:", {
            success: result.success,
            status: result.paymentData?.status,
            plan: result.paymentData?.plan,
            error: result.error
          });
          
          if (result.success) {
            setPaymentResult(result.paymentData);
            if (result.paymentData.status === "SUCCESS") {
              console.log("[UpgradePage] Payment successful! Updating subscription...");
              handleFirebaseUpdate(
                result.paymentData.plan,
                result.paymentData.duration
              );
              // Refetch user plan after successful payment
              setTimeout(() => {
                console.log("[UpgradePage] Refetching user plan after payment...");
                fetchUserPlan();
              }, 1000);
            } else {
              console.log("[UpgradePage] Payment status is not SUCCESS:", result.paymentData.status);
            }
          } else {
            console.error("[UpgradePage] Payment verification failed:", result.error);
            setUpgradeError(result.error || "Payment verification failed.");
          }
        } catch (error) {
          console.error("[UpgradePage] Error verifying payment:", error);
          setUpgradeError("An error occurred while verifying your payment.");
        } finally {
          setVerifying(false);
          router.replace(pathname, undefined, { shallow: true });
        }
      };
      verifyPayment();
    }
  }, [searchParams, router, pathname]);

    // ✅ Fetch user's current plan
  const fetchUserPlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userSubDoc = await getDoc(doc(db, "userSubscriptions", user.uid));
      if (userSubDoc.exists()) {
        const data = userSubDoc.data();
        console.log("[UpgradePage] Fetched user subscription:", data);
        setCurrentPlan(data.plan);
        setCurrentDuration(data.duration || "monthly");
      } else {
        await setDoc(doc(db, "userSubscriptions", user.uid), {
          plan: "Free",
          userId: user.uid,
          userEmail: user.email,
          duration: "monthly",
          updatedAt: new Date(),
        });
        setCurrentPlan("Free");
      }
    } catch (error) {
      console.error("Error fetching user plan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPlan();
  }, [user, db]);

  const handleUpgradeClick = (planName, planDuration) => {
    if (!user) return;
    const planDetails = plans.find((p) => p.name === planName);
    setSelectedPlan(planDetails);
    setDuration(planDuration);
    setShowPayment(true);
  };

  const isChangeDisallowed = (targetPlan, targetDuration) => {
    if (targetPlan === currentPlan && targetDuration === currentDuration)
      return true;
    if (targetPlan === "Free") return true;
    const currentPlanRank = planRank[currentPlan];
    const currentDurationRank = durationRank[currentDuration];
    const targetPlanRank = planRank[targetPlan];
    const targetDurationRank = durationRank[targetDuration];
    return (
      targetPlanRank <= currentPlanRank &&
      targetDurationRank <= currentDurationRank
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Image
          src="/loader.gif"
          alt="Loading..."
          width={350}
          height={350}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="p-6 relative max-w-7xl mx-auto">
      <NavLocation />

      {upgradeError && (
        <div className="mb-4 text-center text-red-600 font-semibold">
          {upgradeError}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Upgrade Your Plan</h1>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg shadow hover:bg-gray-50 transition"
        >
          <History size={16} />
          Payment History
        </button>
      </div>

      {/* Current Plan */}
      <p className="text-gray-600 text-center mb-6">
        Current Plan:{" "}
        <span className="font-medium text-gray-800">
          {currentPlan}{" "}
          ({currentDuration === "annual"
            ? "Annual"
            : currentDuration === "3months"
              ? "3 Months"
              : "Monthly"})
        </span>
      </p>

      {/* Duration Toggle */}
      <div className="flex justify-center gap-3 mb-10">
        {["monthly", "3months", "annual"].map((d) => (
          <button
            key={d}
            onClick={() => setDuration(d)}
            className={`px-5 py-2 rounded-full font-medium transition ${duration === d
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {d === "monthly"
              ? "Monthly"
              : d === "3months"
                ? "3 Months (Save 15%)"
                : "Annual (Save 30%)"}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isDisallowed = isChangeDisallowed(plan.name, duration);
          const isCurrent =
            plan.name === currentPlan && duration === currentDuration;

          return (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 shadow-sm transition hover:shadow-lg ${isCurrent
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
                }`}
            >
              {/* ✅ Popular Tag for Pro Plan */}
              {plan.name === "Pro" && (
                <span className="absolute -top-3 right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                  ⭐ Popular
                </span>
              )}

              <h2 className="text-xl font-bold text-gray-800">{plan.name}</h2>
              <p className="text-3xl font-bold my-4 text-gray-900">
                ₹{calculatePrice(plan.basePrice, duration)}
                <span className="text-sm font-normal text-gray-500">
                  /{duration === "annual"
                    ? "year"
                    : duration === "3months"
                      ? "3 months"
                      : "month"}
                </span>
              </p>
              <p className="text-gray-600 mb-4">
                Storage: <span className="font-medium">{plan.storageLimit}</span>
              </p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="text-green-500" size={20} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgradeClick(plan.name, duration)}
                disabled={isDisallowed}
                className={`w-full py-3 rounded-lg font-medium transition ${isDisallowed
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                {isCurrent
                  ? "Current Plan"
                  : isDisallowed
                    ? "Not Available"
                    : "Select Plan"}
              </button>
            </div>
          );
        })}
      </div>


      {/* Modals */}
      {showPayment && selectedPlan && (
        <PaymentModal
          planName={selectedPlan.name}
          duration={duration}
          basePrice={selectedPlan.basePrice}
          amount={calculatePrice(selectedPlan.basePrice, duration)}
          user={user}
          onClose={() => setShowPayment(false)}
        />
      )}

      {(verifying || paymentResult) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          {verifying ? (
            <div className="bg-white p-6 rounded-lg text-center shadow-lg">
              <p className="font-semibold">
                Verifying your payment, please wait...
              </p>
            </div>
          ) : (
            paymentResult && (
              <PaymentStatus
                status={paymentResult.status}
                plan={paymentResult.plan}
                duration={paymentResult.duration}
                basePrice={paymentResult.basePrice}
                finalAmount={paymentResult.amount}
                user={user}
                orderId={paymentResult.orderId}
                paymentMethod={paymentResult.paymentMethod}
                onClose={() => setPaymentResult(null)}
              />
            )
          )}
        </div>
      )}
      {/* Feature Comparison - Modern Zen Design */}
<div className="mt-16">
  <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
    Compare Plans
  </h2>

  <div className="overflow-x-auto">
    <table className="min-w-full border-separate border-spacing-x-0 border-spacing-y-2">
      <thead>
        <tr>
          <th className="text-left text-sm font-semibold text-gray-600 px-6 py-3">
            Features
          </th>
          {plans.map((plan) => (
            <th
              key={plan.name}
              className={`px-6 py-3 text-center text-sm font-semibold ${
                plan.name === "Pro"
                  ? "bg-blue-50 text-blue-700 rounded-t-lg"
                  : "text-gray-600"
              }`}
            >
              <div className="flex flex-col items-center">
                <span>{plan.name}</span>
                {plan.name === "Pro" && (
                  <span className="mt-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                    Popular
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-sm text-gray-700">
        {/* Storage Limit */}
        <tr className="bg-white shadow-sm rounded-lg">
          <td className="px-6 py-4 font-medium">Storage Limit</td>
          {plans.map((plan) => (
            <td
              key={plan.name}
              className={`px-6 py-4 text-center ${
                plan.name === "Pro" ? "bg-blue-50 font-semibold" : ""
              }`}
            >
              {plan.storageLimit}
            </td>
          ))}
        </tr>

        {/* File Size Limit */}
        <tr className="bg-gray-50 shadow-sm rounded-lg">
          <td className="px-6 py-4 font-medium">File Size Limit</td>
          <td className="px-6 py-4 text-center">50MB</td>
          <td className="px-6 py-4 text-center bg-blue-50 font-semibold">2GB</td>
          <td className="px-6 py-4 text-center">Unlimited</td>
        </tr>

        {/* Password Protection */}
        <tr className="bg-white shadow-sm rounded-lg">
          <td className="px-6 py-4 font-medium">Password Protection</td>
          <td className="px-6 py-4 text-center text-gray-400">—</td>
          <td className="px-6 py-4 text-center bg-blue-50 font-semibold">✅</td>
          <td className="px-6 py-4 text-center">✅</td>
        </tr>

        {/* Advanced Analytics */}
        <tr className="bg-gray-50 shadow-sm rounded-lg">
          <td className="px-6 py-4 font-medium">Advanced Analytics</td>
          <td className="px-6 py-4 text-center text-gray-400">—</td>
          <td className="px-6 py-4 text-center text-gray-400">—</td>
          <td className="px-6 py-4 text-center">✅</td>
        </tr>

        {/* Support */}
        <tr className="bg-white shadow-sm rounded-lg">
          <td className="px-6 py-4 font-medium">Support</td>
          <td className="px-6 py-4 text-center">Email</td>
          <td className="px-6 py-4 text-center bg-blue-50 font-semibold">
            Priority
          </td>
          <td className="px-6 py-4 text-center">24/7</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>


      {showHistory && (
        <PaymentHistoryModal user={user} onClose={() => setShowHistory(false)} />
      )}
    </div>



  );
}

const NavLocation = () => (
  <div className="md:block mb-6">
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm text-gray-600">
        <li>
          <Link
            href="/"
            className="block transition hover:text-gray-700"
          >
            <span className="sr-only">Home</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </Link>
        </li>
        <li className="rtl:rotate-180">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </li>
        <li>
          <Link
            href="/upgrade"
            className="block transition hover:text-gray-700"
          >
            Upgrade
          </Link>
        </li>
      </ol>
    </nav>
  </div>

  
);

function Upgrade() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect_url=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) return null;

  return (
    <div>
      <UpgradePage user={user} />
    </div>
  );
}

export default Upgrade;
