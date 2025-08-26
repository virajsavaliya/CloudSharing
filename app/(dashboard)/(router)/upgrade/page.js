// File: app/(dashboard)/(router)/upgrade/page.js

"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { app } from "../../../../firebaseConfig";
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import Link from "next/link";
import Image from 'next/image';
import { Check, History } from "lucide-react";
import PaymentModal from "./_components/PaymentModal";
import PaymentStatus from "./_components/PaymentStatus";
import PaymentHistoryModal from "./_components/PaymentHistoryModal";

// Helper function to calculate price
const calculatePrice = (basePrice, duration) => {
  const inrPrice = basePrice * 83;
  switch (duration) {
    case '3months': return Math.round(inrPrice * 3 * 0.85);
    case 'annual': return Math.round(inrPrice * 12 * 0.7);
    default: return Math.round(inrPrice);
  }
};

// Data for the subscription plans
const plans = [
  { name: "Free", basePrice: 0, features: ["50MB file size limit", "Basic sharing", "Email support"], storageLimit: "1 GB" },
  { name: "Pro", basePrice: 9.99, features: ["2GB file size limit", "Password protection", "Priority support"], storageLimit: "100 GB" },
  { name: "Premium", basePrice: 19.99, features: ["Unlimited file size", "Advanced analytics", "24/7 support"], storageLimit: "500 GB" },
];

// Hierarchies for plans and durations
const planRank = { "Free": 0, "Pro": 1, "Premium": 2 };
const durationRank = { "monthly": 1, "3months": 2, "annual": 3 };

// Main UI component
function UpgradePage({ user }) {
  // State management
  const [currentPlan, setCurrentPlan] = useState("Free");
  const [currentDuration, setCurrentDuration] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [duration, setDuration] = useState('monthly');
  const [upgradeError, setUpgradeError] = useState("");

  // State for handling payment verification
  const [verifying, setVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const [showHistory, setShowHistory] = useState(false);
  
  const db = getFirestore(app);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Updates the user's main subscription document in Firestore
  const handleFirebaseUpdate = async (plan, dur) => {
    if (!plan || !dur || !user) return;
    try {
      await setDoc(doc(db, "userSubscriptions", user.uid), {
        plan: plan, duration: dur, userId: user.uid, userEmail: user.email, updatedAt: new Date(),
      }, { merge: true });
      setCurrentPlan(plan);
      setCurrentDuration(dur);
    } catch (error) {
      console.error("Error upgrading plan in Firestore:", error);
      setUpgradeError("Failed to update your plan. Please contact support.");
    }
  };

  // --- NEW: useEffect hook to handle the payment verification ---
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (orderId) {
      setVerifying(true);
      const verifyPayment = async () => {
        try {
          const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId }),
          });
          const result = await res.json();
          if (result.success) {
            setPaymentResult(result.paymentData);
            // If payment was successful, update the main subscription
            if (result.paymentData.status === 'SUCCESS') {
              handleFirebaseUpdate(result.paymentData.plan, result.paymentData.duration);
            }
          } else {
            setUpgradeError(result.error || "Payment verification failed.");
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          setUpgradeError("An error occurred while verifying your payment.");
        } finally {
          setVerifying(false);
          // Clean the URL to remove search params
          router.replace(pathname, undefined, { shallow: true });
        }
      };
      verifyPayment();
    }
  }, [searchParams, router, pathname]);

  // Fetches user's current plan on initial load
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userSubDoc = await getDoc(doc(db, "userSubscriptions", user.uid));
        if (userSubDoc.exists()) {
          const data = userSubDoc.data();
          setCurrentPlan(data.plan);
          setCurrentDuration(data.duration || 'monthly');
        } else {
          await setDoc(doc(db, "userSubscriptions", user.uid), {
            plan: "Free", userId: user.uid, userEmail: user.email, duration: 'monthly', updatedAt: new Date(),
          });
          setCurrentPlan("Free");
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserPlan();
  }, [user, db]);

  // Triggered when a user clicks the "Upgrade" button
  const handleUpgradeClick = (planName, planDuration) => {
    if (!user) return;
    const planDetails = plans.find(p => p.name === planName);
    setSelectedPlan(planDetails);
    setDuration(planDuration);
    setShowPayment(true);
  };

  // Logic to determine if a plan change is allowed
  const isChangeDisallowed = (targetPlan, targetDuration) => {
    if (targetPlan === currentPlan && targetDuration === currentDuration) return true;
    if (targetPlan === "Free") return true;
    const currentPlanRank = planRank[currentPlan];
    const currentDurationRank = durationRank[currentDuration];
    const targetPlanRank = planRank[targetPlan];
    const targetDurationRank = durationRank[targetDuration];
    return targetPlanRank <= currentPlanRank && targetDurationRank <= currentDurationRank;
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Image src="/loader.gif" alt="Loading..." width={350} height={350} /></div>;
  }

  return (
    <div className="p-6 relative">
      <NavLocation />
      {upgradeError && <div className="mb-4 text-center text-red-600 font-semibold">{upgradeError}</div>}
      
      <div className="text-center mb-8">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div></div> {/* Spacer */}
            <h1 className="text-3xl font-bold">Upgrade Your Plan</h1>
            <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
                <History size={16} />
                Payment History
            </button>
        </div>
        <p className="text-gray-600 mt-2">
          Current Plan: {currentPlan} ({currentDuration === 'annual' ? 'Annual' : currentDuration === '3months' ? '3 Months' : 'Monthly'})
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <button onClick={() => setDuration('monthly')} className={`px-4 py-2 rounded-lg ${duration === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Monthly</button>
          <button onClick={() => setDuration('3months')} className={`px-4 py-2 rounded-lg ${duration === '3months' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>3 Months <span className="text-sm text-green-500">Save 15%</span></button>
          <button onClick={() => setDuration('annual')} className={`px-4 py-2 rounded-lg ${duration === 'annual' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>Annual <span className="text-sm text-green-500">Save 30%</span></button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const isDisallowed = isChangeDisallowed(plan.name, duration);
          const isCurrent = plan.name === currentPlan && duration === currentDuration;
          return (
            <div key={plan.name} className={`rounded-lg border p-6 ${isCurrent ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="text-3xl font-bold my-4">₹{calculatePrice(plan.basePrice, duration)}<span className="text-sm font-normal">/{duration === 'annual' ? 'year' : duration === '3months' ? '3 months' : 'month'}</span></p>
              <p className="text-gray-600 mb-4">Storage: {plan.storageLimit}</p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => <li key={index} className="flex items-center gap-2"><Check className="text-green-500" size={20} /><span>{feature}</span></li>)}
              </ul>
              <button onClick={() => handleUpgradeClick(plan.name, duration)} disabled={isDisallowed} className={`w-full py-2 rounded-md ${isDisallowed ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`} title={isDisallowed ? "This plan change is not allowed." : "Select this plan"}>
                {isCurrent ? "Current Plan" : isDisallowed ? "Not Available" : "Select Plan"}
              </button>
            </div>
          );
        })}
      </div>

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
                <div className="bg-white p-6 rounded-lg text-center"><p className="font-semibold">Verifying your payment, please wait...</p></div>
            ) : paymentResult && (
                <PaymentStatus
                    status={paymentResult.status}
                    plan={paymentResult.plan}
                    duration={paymentResult.duration}
                    basePrice={paymentResult.basePrice}
                    finalAmount={paymentResult.amount}
                    user={user}
                    orderId={paymentResult.orderId}
                    onClose={() => setPaymentResult(null)}
                />
            )}
        </div>
      )}

      {showHistory && <PaymentHistoryModal user={user} onClose={() => setShowHistory(false)} />}
    </div>
  );
}

const NavLocation = () => (
    <div className="md:block mb-6"><nav aria-label="Breadcrumb"><ol className="flex items-center gap-1 text-sm text-gray-600"><li><Link href="/" className="block transition hover:text-gray-700"><span className="sr-only">Home</span><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></Link></li><li className="rtl:rotate-180"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></li><li><Link href="/upgrade" className="block transition hover:text-gray-700">Upgrade</Link></li></ol></nav></div>
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

  return <div><UpgradePage user={user} /></div>;
}

export default Upgrade;