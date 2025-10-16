// File: app/api/verify-payment/route.js

import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { adminDb } from "../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ success: false, error: "Order ID is required." }, { status: 400 });
    }

    // Check if Cashfree credentials are configured
    if (!process.env.NEXT_PUBLIC_CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      console.error("[Verify Payment] Missing Cashfree credentials");
      throw new Error("Payment gateway not configured. Please contact support.");
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
    console.log(`[Verify Payment] Fetching order from Cashfree: ${url}`);
    
    const response = await fetch(url, options);
    const cashfreeOrder = await response.json();

    if (!response.ok) {
      console.error("[Verify Payment] Cashfree verification API failed:", cashfreeOrder);
      throw new Error(cashfreeOrder.message || "Failed to get payment status from Cashfree.");
    }

    // --- 2. Update Firestore using the ADMIN SDK ---
    const paymentRef = adminDb.collection('paymentHistory').doc(order_id);
    const finalStatus = cashfreeOrder.order_status === 'PAID' ? 'SUCCESS' : 'FAILED';
    
    // First, get the payment record to access user info and plan details
    const paymentDoc = await paymentRef.get();
    if (!paymentDoc.exists) {
      console.error(`[Verify Payment] Payment record not found for order: ${order_id}`);
      throw new Error("Payment record not found. Please contact support with your order ID.");
    }
    const paymentData = paymentDoc.data();

    // Validate required fields
    if (!paymentData.userId) {
      console.error(`[Verify Payment] UserId missing in payment record for order: ${order_id}`);
      throw new Error("Payment data is incomplete. Please contact support.");
    }

    if (!paymentData.plan || !paymentData.duration) {
      console.error(`[Verify Payment] Plan or duration missing for order: ${order_id}`);
      throw new Error("Plan information is incomplete. Please contact support.");
    }
    
    // Update payment record
    const paymentMethodFromCashfree = cashfreeOrder.order_payment_method || 'Card';
    console.log(`[Verify Payment] Payment method from Cashfree:`, paymentMethodFromCashfree);
    
    await paymentRef.update({
      status: finalStatus,
      transactionId: cashfreeOrder.cf_order_id ?? 'N/A',
      paymentMethod: paymentMethodFromCashfree,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If payment is successful, update user subscription
    if (finalStatus === 'SUCCESS') {
      try {
        if (!paymentData.userId) {
          throw new Error("UserId not found in payment data");
        }
        
        // Calculate subscription start and end dates
        const startDate = new Date();
        let endDate = new Date(startDate);

        // Set end date based on duration
        switch (paymentData.duration) {
          case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          case '3months':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
          case 'annual':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
          default:
            endDate.setMonth(endDate.getMonth() + 1); // Default to monthly
        }

        await adminDb.collection('userSubscriptions').doc(paymentData.userId).set({
          plan: paymentData.plan,
          duration: paymentData.duration,
          userId: paymentData.userId,
          userEmail: paymentData.userEmail,
          startDate: admin.firestore.FieldValue.serverTimestamp(),
          endDate: admin.firestore.Timestamp.fromDate(endDate),
          status: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentId: order_id
        }, { merge: true });

        console.log(`[Verify Payment] Successfully updated subscription for user ${paymentData.userId}`);
      } catch (subscriptionError) {
        console.error(`[Verify Payment] Error updating subscription:`, subscriptionError);
        throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
      }
    }

    // --- 3. Return the Updated Record to the Frontend ---
    const updatedDoc = await paymentRef.get();
    if (!updatedDoc.exists) {
      throw new Error("Critical: Payment record not found after update.");
    }

    return NextResponse.json({ success: true, paymentData: updatedDoc.data() });

  } catch (error) {
    console.error("[Verify Payment Route Error]:", error.message, error.stack);
    
    // Return more helpful error messages for debugging
    const errorMessage = error.message || "Internal Server Error";
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}