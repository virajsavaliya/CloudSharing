"use client";
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { app } from "../../../../firebaseConfig";
import Link from "next/link";
import { Check } from "lucide-react";
import PaymentModal from "./_components/PaymentModal";
import PaymentSuccess from "./_components/PaymentSuccess";
import Image from 'next/image'
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../_utils/FirebaseAuthContext";

const calculatePrice = (basePrice, duration) => {
  // Convert USD to INR (using approximate rate of 1 USD = 83 INR)
  const inrPrice = basePrice * 83;
  
  switch (duration) {
    case '3months':
      return Math.round(inrPrice * 3 * 0.85); // 15% discount
    case 'annual':
      return Math.round(inrPrice * 12 * 0.7); // 30% discount
    default:
      return Math.round(inrPrice);
  }
};

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
    features: ["2GB file size limit", "Password protection", "Priority support"],
    storageLimit: "100 GB",
  },
  {
    name: "Premium",
    basePrice: 19.99,
    features: ["Unlimited file size", "Advanced analytics", "24/7 support"],
    storageLimit: "500 GB",
  },
];

function UpgradePage({ user }) {
  // Use Firebase Auth for user
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duration, setDuration] = useState('monthly');
  const [currentDuration, setCurrentDuration] = useState('monthly');
  const [upgradeError, setUpgradeError] = useState(""); // <-- add this line
  const db = getFirestore(app);

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return;
      try {
        const userSubDoc = await getDoc(doc(db, "userSubscriptions", user.uid));
        if (userSubDoc.exists()) {
          setCurrentPlan(userSubDoc.data().plan);
          setCurrentDuration(userSubDoc.data().duration || 'monthly');
          setDuration(userSubDoc.data().duration || 'monthly');
        } else {
          await setDoc(doc(db, "userSubscriptions", user.uid), {
            plan: "Free",
            userId: user.uid,
            userEmail: user.email,
            duration: 'monthly',
            updatedAt: new Date(),
          });
          setCurrentPlan("Free");
          setCurrentDuration('monthly');
          setDuration('monthly');
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user plan:", error);
        setLoading(false);
      }
    };
    fetchUserPlan();
  }, [user, db]);

  const handleUpgrade = async (planName) => {
    if (!user) return;
    // Allow upgrading to different duration of same plan
    if (planName === currentPlan && duration !== currentDuration) {
      setSelectedPlan(planName);
      setShowPayment(true);
      return;
    }
    // Regular plan upgrade
    setSelectedPlan(planName);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    try {
      await setDoc(doc(db, "userSubscriptions", user.uid), {
        plan: selectedPlan,
        userId: user.uid,
        userEmail: user.email,
        duration: duration,
        updatedAt: new Date(),
      });

      setCurrentPlan(selectedPlan);
      setCurrentDuration(duration);
      setShowPayment(false);
      setShowSuccess(true);
      setUpgradeError(""); // clear error on success

      // Hide success animation after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error upgrading plan:", error);
      setUpgradeError("Failed to upgrade. Please try again."); // <-- set error
      // alert("Failed to upgrade. Please try again."); // (optional: remove alert)
    }
  };

  const isDowngrade = (planName) => {
    // Prevent downgrade to Free plan from Pro or Premium
    if (planName === "Free" && (currentPlan === "Pro" || currentPlan === "Premium")) {
      return true;
    }
    // Prevent downgrade to Pro from Premium
    if (planName === "Pro" && currentPlan === "Premium") {
      return true;
    }
    return false;
  };

  const isCurrentPlanDuration = (plan, planDuration) => {
    // For Free plan, show as current plan regardless of duration
    if (currentPlan === "Free" && plan === "Free") {
      return true;
    }
    // Only show as current plan if both plan AND duration match
    return currentPlan === plan && currentDuration === planDuration;
  };

  const isDurationDowngrade = (selectedDuration) => {
    if (currentPlan === "Free") return false;
    
    const durationRank = {
      'monthly': 1,
      '3months': 2,
      'annual': 3
    };
    
    return durationRank[selectedDuration] < durationRank[currentDuration];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
            <Image 
              src="/loader.gif" 
              alt="Loading..." 
              width={350}
              height={350}
              className="w-100 h-100" 
            />
          </div>
    );
  }

  return (
    <div className="p-6 relative">
      <NavLocation />
      {/* Show upgrade error if present */}
      {upgradeError && (
        <div className="mb-4 text-center text-red-600 font-semibold">
          {upgradeError}
        </div>
      )}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Upgrade Your Plan</h1>
        <p className="text-gray-600 mt-2">
          Current Plan: {currentPlan} ({currentDuration === 'annual' ? 'Annual' : currentDuration === '3months' ? '3 Months' : 'Monthly'})
        </p>
        
        {/* Duration Selector */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setDuration('monthly')}
            disabled={isDurationDowngrade('monthly')}
            className={`px-4 py-2 rounded-lg ${
              isDurationDowngrade('monthly') 
                ? 'bg-gray-300 cursor-not-allowed'
                : duration === 'monthly' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100'
            }`}
            title={isDurationDowngrade('monthly') ? "Cannot downgrade duration" : ""}
          >
            Monthly
          </button>
          <button
            onClick={() => setDuration('3months')}
            disabled={isDurationDowngrade('3months')}
            className={`px-4 py-2 rounded-lg ${
              isDurationDowngrade('3months')
                ? 'bg-gray-300 cursor-not-allowed'
                : duration === '3months' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100'
            }`}
            title={isDurationDowngrade('3months') ? "Cannot downgrade duration" : ""}
          >
            3 Months <span className="text-sm text-green-500">Save 15%</span>
          </button>
          <button
            onClick={() => setDuration('annual')}
            disabled={isDurationDowngrade('annual')}
            className={`px-4 py-2 rounded-lg ${
              isDurationDowngrade('annual')
                ? 'bg-gray-300 cursor-not-allowed'
                : duration === 'annual' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100'
            }`}
            title={isDurationDowngrade('annual') ? "Cannot downgrade duration" : ""}
          >
            Annual <span className="text-sm text-green-500">Save 30%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isDowngrading = isDowngrade(plan.name);
          const isCurrentPlan = isCurrentPlanDuration(plan.name, duration);
          return (
            <div
              key={plan.name}
              className={`rounded-lg border p-6 ${
                isCurrentPlan
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="text-3xl font-bold my-4">
                ₹{calculatePrice(plan.basePrice, duration)}
                <span className="text-sm font-normal">
                  /{duration === 'annual' ? 'year' : duration === '3months' ? '3 months' : 'month'}
                </span>
              </p>
              <p className="text-gray-600 mb-4">Storage: {plan.storageLimit}</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="text-green-500" size={20} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.name)}
                disabled={isCurrentPlan || isDowngrading}
                className={`w-full py-2 rounded-md ${
                  isCurrentPlan
                    ? "bg-gray-300 cursor-not-allowed"
                    : isDowngrading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                title={
                  isDowngrading
                    ? "Cannot downgrade from a higher plan"
                    : isCurrentPlan
                    ? "Current Plan"
                    : "Upgrade to this plan"
                }
              >
                {isCurrentPlan 
                  ? "Current Plan" 
                  : isDowngrading 
                  ? "Cannot Downgrade" 
                  : "Upgrade"}
              </button>
            </div>
          );
        })}
      </div>

      {showPayment && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showSuccess && <PaymentSuccess />}
    </div>
  );
}

const NavLocation = () => (
  <div className="md:block mb-6">
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 text-sm text-gray-600">
        <li>
          <Link href="/" className="block transition hover:text-gray-700">
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
          <Link href="/upgrade" className="block transition hover:text-gray-700">
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
