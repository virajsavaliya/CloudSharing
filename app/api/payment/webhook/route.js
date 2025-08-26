import { NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg';
import { adminDb } from '../../../../lib/firebaseAdmin'; // Use Firebase Admin SDK
import { FieldValue } from 'firebase-admin/firestore';

// ✅ Initialize Cashfree using the correct string method
Cashfree.XClientId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = "SANDBOX"; // Use "SANDBOX" or "PRODUCTION"

export async function POST(req) {
    try {
        const signature = req.headers.get("x-webhook-signature");
        const timestamp = req.headers.get("x-webhook-timestamp");
        const payload = await req.text();

        // 1. Verify the webhook signature to ensure it's from Cashfree
        const isSignatureValid = Cashfree.PGVerifyWebhookSignature(signature, payload, timestamp);

        if (!isSignatureValid) {
            console.warn("Invalid Cashfree webhook signature received.");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const data = JSON.parse(payload);
        const orderId = data.data.order.order_id;
        const orderStatus = data.data.order.order_status;
        
        console.log(`Webhook received for order ${orderId} with status ${orderStatus}`);

        // 2. Update the order status in your Firestore database
        const paymentRef = adminDb.collection('paymentHistory').doc(orderId);
        let finalStatus;

        if (orderStatus === 'PAID') {
            finalStatus = 'SUCCESS';
        } else if (['EXPIRED', 'FAILED', 'CANCELLED'].includes(orderStatus)) {
            finalStatus = 'FAILED';
        } else {
            finalStatus = 'PENDING'; // Or any other status you handle
        }

        await paymentRef.update({
            status: finalStatus,
            updatedAt: FieldValue.serverTimestamp() // Log when the webhook updated the record
        });
        
        // 3. Respond to Cashfree to acknowledge receipt
        return NextResponse.json({ status: "ok" });

    } catch (error) {
        console.error("Cashfree Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}