import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { app } from "../../../firebaseConfig"; 
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const db = getFirestore(app);

export async function POST(req) {
  let order_id; 

  try {
    const { amount, user: customer, planName, duration, basePrice } = await req.json();

    if (!customer || !customer.uid || !customer.email) {
      return NextResponse.json(
        { success: false, error: "User information is missing. Cannot create payment." },
        { status: 400 } 
      );
    }

    order_id = uuidv4();

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
      paymentMethod: 'Pending' // ✅ Initialize the field here
    });

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
          return_url: `http://localhost:3000/upgrade?order_id={order_id}`
        },
        order_note: `Subscription for ${planName} - ${duration}`
      })
    };

    const response = await fetch('https://sandbox.cashfree.com/pg/orders', options);
    const data = await response.json();

    if (data.payment_session_id) {
      return NextResponse.json({ success: true, payment_session_id: data.payment_session_id });
    } else {
      await setDoc(paymentRef, { status: 'FAILED', failureReason: data.message || 'Unknown error' }, { merge: true });
      return NextResponse.json({ success: false, error: data.message || "Failed to create payment session" }, { status: 400 });
    }

  } catch (error) {
    if (order_id) {
      const paymentRef = doc(db, "paymentHistory", order_id);
      await setDoc(paymentRef, { status: 'FAILED', failureReason: error.message }, { merge: true });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}