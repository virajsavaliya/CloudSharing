"use client";
import React, { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { load } from "@cashfreepayments/cashfree-js";

export default function PaymentModal({
  planName,
  duration,
  basePrice, // This prop is already here
  amount,
  user,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cashfree, setCashfree] = useState(null);

  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        const cf = await load({
          mode: "sandbox",
        });
        setCashfree(cf);
      } catch (e) {
        console.error("Error initializing Cashfree SDK:", e);
        setError("Could not load payment gateway. Please try again later.");
      }
    };
    initializeCashfree();
  }, []);

  const getSessionId = async () => {
    try {
      const res = await fetch("/api/create-payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ✅ ADD basePrice to the body
        body: JSON.stringify({
          amount,
          user,
          planName,
          duration,
          basePrice,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create payment session");
      }

      const data = await res.json();
      return data.payment_session_id; // Adjusted based on your new API response
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const initiatePayment = async () => {
    if (!cashfree) {
      setError("Payment gateway is not ready.");
      return;
    }
    setLoading(true);
    setError("");

    const sessionId = await getSessionId();

    if (sessionId) {
      const checkoutOptions = {
        paymentSessionId: sessionId,
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/upgrade?order_id={order_id}`,
      };
      cashfree.checkout(checkoutOptions).then((result) => {
        if (result.error) {
          setError(result.error.message);
        }
      });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-sm text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-2">Complete Your Purchase</h2>
        <p className="text-gray-600 mb-6">
          You are upgrading to the{" "}
          <span className="font-semibold text-blue-600">{planName}</span> plan.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-lg text-gray-700">Amount to Pay</p>
          <p className="text-4xl font-bold text-blue-600">₹{amount}</p>
        </div>

        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <button
          onClick={initiatePayment}
          disabled={loading || !cashfree}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <DollarSign size={20} />
          {loading ? "Processing..." : "Proceed to Pay"}
        </button>
        <p className="text-xs text-gray-400 mt-4">
          You will be redirected to our secure payment partner.
        </p>
      </div>
    </div>
  );
}