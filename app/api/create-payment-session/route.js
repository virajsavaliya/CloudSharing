import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { app } from "../../../firebaseConfig"; 
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const db = getFirestore(app);

export async function POST(req) {
  let order_id; 

  try {
    const { amount, user: customer, planName, duration, basePrice } = await req.json();

    console.log("[Create Payment Session] Received request:", {
      amount,
      planName,
      duration,
      customerId: customer?.uid,
      basePrice
    });

    if (!customer || !customer.uid || !customer.email) {
      console.error("[Create Payment Session] Missing customer data");
      return NextResponse.json(
        { success: false, error: "User information is missing. Cannot create payment." },
        { status: 400 } 
      );
    }

    order_id = uuidv4();
    console.log("[Create Payment Session] Generated order_id:", order_id);

    const paymentRef = doc(db, "paymentHistory", order_id);
    await setDoc(paymentRef, {
      userId: customer.uid,
      orderId: order_id,
      amount: amount,
      plan: planName,
      duration: duration,
      basePrice: basePrice,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      userEmail: customer.email,
      paymentMethod: 'Pending'
    });

    console.log("[Create Payment Session] Saved payment record to Firestore");

    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL_UPGRADE}${process.env.NEXT_PUBLIC_BASE_URL_UPGRADE?.endsWith('/') ? '' : '/'}upgrade?order_id={order_id}`;
    console.log("[Create Payment Session] Constructed return URL:", returnUrl);

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        order_amount: amount,
        order_currency: "INR",
        order_id: order_id,
        customer_details: {
          customer_id: customer.uid,
          customer_email: customer.email,
          customer_phone: customer.phone || "9898989898" 
        },
        order_meta: {
          return_url: returnUrl
        },
        order_note: `Subscription for ${planName} - ${duration}`
      })
    };

    console.log("[Create Payment Session] Calling Cashfree API...");
    const response = await fetch('https://sandbox.cashfree.com/pg/orders', options);
    const data = await response.json();

    console.log("[Create Payment Session] Cashfree response:", {
      status: response.status,
      hasSessionId: !!data.payment_session_id,
      message: data.message
    });

    if (data.payment_session_id) {
      console.log("[Create Payment Session] Success! Session ID:", data.payment_session_id);
      return NextResponse.json({ success: true, payment_session_id: data.payment_session_id });
    } else {
      console.error("[Create Payment Session] No session ID returned");
      await setDoc(paymentRef, { status: 'FAILED', failureReason: data.message || 'Unknown error' }, { merge: true });
      return NextResponse.json({ success: false, error: data.message || "Failed to create payment session" }, { status: 400 });
    }

  } catch (error) {
    console.error("[Create Payment Session] Error:", error.message, error.stack);
    if (order_id) {
      const paymentRef = doc(db, "paymentHistory", order_id);
      await setDoc(paymentRef, { status: 'FAILED', failureReason: error.message }, { merge: true });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}