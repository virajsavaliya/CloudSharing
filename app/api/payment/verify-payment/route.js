// File: app/api/verify-payment/route.js

import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebaseAdmin";

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

    // --- 2. Correctly Determine the Final Status ---
    const paymentRef = adminDb.collection('paymentHistory').doc(order_id);
    let finalStatus;

    if (cashfreeOrder.order_status === 'PAID') {
      finalStatus = 'SUCCESS';
    } else if (['EXPIRED', 'FAILED', 'CANCELLED'].includes(cashfreeOrder.order_status)) {
      finalStatus = 'FAILED';
    } else {
      // Any other status ('ACTIVE', etc.) is treated as PENDING
      finalStatus = 'PENDING';
    }
    
    // --- 3. Update Firestore if the Status has Changed ---
    const existingDoc = await paymentRef.get();
    const existingStatus = existingDoc.exists ? existingDoc.data().status : null;

    if (existingStatus !== finalStatus) {
      await paymentRef.update({
        status: finalStatus,
        transactionId: cashfreeOrder.cf_order_id ?? 'N/A',
        paymentMethod: cashfreeOrder.order_payment_method ?? 'N/A',
      });
    }

    // --- 4. Return the Updated Record to the Frontend ---
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