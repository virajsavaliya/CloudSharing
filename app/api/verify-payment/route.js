// File: app/api/verify-payment/route.js

import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ success: false, error: "Order ID is required." }, { status: 400 });
    }

    // --- 1. Fetch Final Order Status from Cashfree ---
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
    };

    const url = `https://sandbox.cashfree.com/pg/orders/${order_id}`;
    const response = await fetch(url, options);
    const cashfreeOrder = await response.json();

    if (!response.ok) {
      console.error("Cashfree verification API failed:", cashfreeOrder);
      throw new Error(cashfreeOrder.message || "Failed to get payment status from Cashfree.");
    }

    // --- 2. Update Firestore using the ADMIN SDK ---
    const paymentRef = adminDb.collection('paymentHistory').doc(order_id);
    const finalStatus = cashfreeOrder.order_status === 'PAID' ? 'SUCCESS' : 'FAILED';
    
    // First, get the payment record to access user info and plan details
    const paymentDoc = await paymentRef.get();
    if (!paymentDoc.exists) {
      throw new Error("Payment record not found");
    }
    const paymentData = paymentDoc.data();
    
    // Update payment record
    await paymentRef.update({
      status: finalStatus,
      transactionId: cashfreeOrder.cf_order_id ?? 'N/A',
      paymentMethod: cashfreeOrder.order_payment_method ?? 'N/A',
      updatedAt: adminDb.FieldValue.serverTimestamp()
    });

    // If payment is successful, update user subscription
    if (finalStatus === 'SUCCESS') {
      await adminDb.collection('userSubscriptions').doc(paymentData.userId).set({
        plan: paymentData.plan,
        duration: paymentData.duration,
        userId: paymentData.userId,
        userEmail: paymentData.userEmail,
        updatedAt: adminDb.FieldValue.serverTimestamp(),
        paymentId: order_id
      }, { merge: true });
    }

    // --- 3. Return the Updated Record to the Frontend ---
    const updatedDoc = await paymentRef.get();
    if (!updatedDoc.exists) {
      throw new Error("Critical: Payment record not found after update.");
    }

    return NextResponse.json({ success: true, paymentData: updatedDoc.data() });

  } catch (error) {
    console.error("[Verify Payment Route Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}