# 🔧 Fix: Firebase Admin SDK Field Values Error

## Error Message
```
Cannot read properties of undefined (reading 'serverTimestamp')
TypeError: Cannot read properties of undefined (reading 'serverTimestamp')
    at POST (webpack-internal:///(rsc)/./app/api/verify-payment/route.js:68:91)
```

## Root Cause

The code was trying to use `adminDb.FieldValue.serverTimestamp()` but:
- `adminDb` is the Firestore database instance
- It doesn't have a `FieldValue` property
- In Firebase Admin SDK, you need to use `admin.firestore.FieldValue`

## What Was Wrong

```javascript
// ❌ WRONG - adminDb doesn't have FieldValue
import { adminDb } from "../../../lib/firebaseAdmin";

await adminDb.collection('userSubscriptions').doc(userId).set({
  startDate: adminDb.FieldValue.serverTimestamp(),  // ❌ undefined
  endDate: adminDb.Timestamp.fromDate(date),         // ❌ undefined
});
```

## What's Fixed

```javascript
// ✅ CORRECT - Import admin and use admin.firestore
import admin from "firebase-admin";
import { adminDb } from "../../../lib/firebaseAdmin";

await adminDb.collection('userSubscriptions').doc(userId).set({
  startDate: admin.firestore.FieldValue.serverTimestamp(),  // ✅ Works!
  endDate: admin.firestore.Timestamp.fromDate(date),        // ✅ Works!
});
```

## Files Fixed

1. ✅ `/app/api/verify-payment/route.js`
   - Added `import admin from "firebase-admin"`
   - Changed `adminDb.FieldValue.serverTimestamp()` → `admin.firestore.FieldValue.serverTimestamp()`
   - Changed `adminDb.Timestamp.fromDate()` → `admin.firestore.Timestamp.fromDate()`

2. ✅ `/app/api/payment/verify-payment/route.js`
   - Same fixes as above

## Testing

Now try the payment flow again:

```bash
# Make sure you're running locally with npm run dev
npm run dev

# Go to http://localhost:3000/upgrade
# Try upgrading a plan
# Watch the console - you should NOT see the "Cannot read properties of undefined" error anymore
```

## Expected Behavior Now

When you complete payment:

1. ✅ `/api/create-payment-session` succeeds
2. ✅ Cashfree form appears
3. ✅ You complete payment (test card: 4111111111111111)
4. ✅ Redirects to `/upgrade?order_id=...`
5. ✅ `/api/verify-payment` is called
6. ✅ **userSubscriptions** collection gets updated (this was failing!)
7. ✅ See "Payment Successful!" modal
8. ✅ User's plan upgrades in the app

## Console Output (After Fix)

You should see:
```
[Create Payment Session] Received request: {amount: 827, planName: "Pro", ...}
[Create Payment Session] Success! Session ID: session_...
[PaymentModal] Got session ID: session_...
[UpgradePage] Checking for order_id in URL params: fcd83168-...
[Verify Payment] Fetching order from Cashfree: https://sandbox.cashfree.com/pg/orders/fcd83168-...
[Verify Payment] Updated payment status to SUCCESS for order fcd83168-...
[Verify Payment] Successfully updated subscription for user abc123...
[UpgradePage] Payment successful! Updating subscription...
[UpgradePage] Successfully updated subscription in Firestore
```

**No errors!** ✅

## If You Still See Errors

1. Clear browser cache: `Cmd+Shift+Delete` (or Ctrl+Shift+Delete on Windows)
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Try payment again
4. Check that you're using the latest code

The fix is now complete! 🎉
