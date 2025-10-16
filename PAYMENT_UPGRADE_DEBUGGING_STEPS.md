# Step-by-Step Payment Upgrade Flow - Debugging Guide

## Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "UPGRADE" BUTTON                                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. PaymentModal Opens                                           │
│    - Loads Cashfree SDK                                         │
│    - Shows plan details & amount                                │
│    - "Proceed to Pay" button visible                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼ User clicks "Proceed to Pay"
┌─────────────────────────────────────────────────────────────────┐
│ 3. CREATE-PAYMENT-SESSION API CALLED                            │
│    POST /api/create-payment-session                             │
│    Sends: amount, user, planName, duration, basePrice           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─ Server logs: "[Create Payment Session] Received request"
                 ├─ Creates order_id (UUID)
                 ├─ Saves to Firestore: paymentHistory/{order_id}
                 ├─ Calls Cashfree API
                 └─ Returns: payment_session_id
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CASHFREE PAYMENT FORM OPENS                                  │
│    - User enters payment details                                │
│    - Completes payment (mock in sandbox)                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. CASHFREE REDIRECTS TO RETURN URL                             │
│    URL: /upgrade?order_id={order_id}                            │
│    ⚠️ CRITICAL: Return URL must be correct!                    │
│    Should be: https://yourapp.vercel.app/upgrade                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─ Browser receives: order_id from URL param
                 └─ useEffect triggers on searchParams change
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. VERIFY-PAYMENT API CALLED                                    │
│    POST /api/verify-payment                                     │
│    Sends: { order_id: "..." }                                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├─ Server logs: "[Verify Payment] Fetching order from Cashfree"
                 ├─ Calls: https://sandbox.cashfree.com/pg/orders/{order_id}
                 ├─ Gets payment status from Cashfree
                 ├─ Updates paymentHistory: status = SUCCESS/FAILED
                 ├─ If SUCCESS: Updates userSubscriptions
                 └─ Returns: { success: true, paymentData: {...} }
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. FRONTEND PROCESSES RESULT                                    │
│    - Sets paymentResult state                                   │
│    - If status === "SUCCESS":                                   │
│      - Calls handleFirebaseUpdate()                             │
│      - Updates local state: currentPlan                         │
│      - Shows PaymentStatus component                            │
│    - If status !== "SUCCESS":                                   │
│      - Shows error message                                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. PAYMENT STATUS MODAL SHOWS                                   │
│    - SUCCESS: Green checkmark + "Plan upgraded!"                │
│    - FAILED: Red X + "Try again"                                │
│    - PENDING: Yellow clock + "Processing..."                    │
└─────────────────────────────────────────────────────────────────┘
```

## Debugging Checklist - Complete Each Step

### ✅ STEP 1: Verify Environment Variables on Vercel

```bash
# Check your Vercel project settings:
# Settings → Environment Variables

Required variables:
✓ NEXT_PUBLIC_CASHFREE_APP_ID
✓ CASHFREE_SECRET_KEY
✓ GOOGLE_SERVICE_ACCOUNT_JSON
✓ NEXT_PUBLIC_BASE_URL_UPGRADE

# For Vercel, NEXT_PUBLIC_BASE_URL_UPGRADE should be:
# https://yourapp.vercel.app/
# ⚠️ MUST end with / (slash)
```

### ✅ STEP 2: Open Browser DevTools Console

Press `F12` or `Cmd+Option+I` and go to **Console** tab.

You should see logs like:
```
[PaymentModal] Creating payment session for: {amount: 827, planName: "Pro", duration: "monthly"}
[PaymentModal] Session creation response status: 200
[PaymentModal] Got session ID: 48b8f5c2-...
[PaymentModal] Opening Cashfree checkout...
```

**If you don't see these logs:**
- Payment modal isn't loading
- Check browser console for errors
- Verify Cashfree SDK loaded

### ✅ STEP 3: Check Server Logs (Vercel Functions)

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click the **Latest Deployment**
3. Go to **Functions** tab
4. Click on `/api/create-payment-session`
5. Look for logs like:

```
[Create Payment Session] Received request: {amount: 827, planName: "Pro", duration: "monthly", customerId: "abc123", basePrice: 9.99}
[Create Payment Session] Generated order_id: 48b8f5c2-...
[Create Payment Session] Saved payment record to Firestore
[Create Payment Session] Constructed return URL: https://yourapp.vercel.app/upgrade?order_id={order_id}
[Create Payment Session] Calling Cashfree API...
[Create Payment Session] Cashfree response: {status: 200, hasSessionId: true, message: null}
[Create Payment Session] Success! Session ID: 48b8f5c2-...
```

**If you see errors:**
- Check CASHFREE_SECRET_KEY (wrong secret = 400 error)
- Check NEXT_PUBLIC_CASHFREE_APP_ID (wrong ID = invalid request)
- Check network connectivity to Cashfree (rare)

### ✅ STEP 4: Complete Mock Payment

1. When Cashfree form appears, enter mock card:
   - **Card Number**: 4111111111111111
   - **Expiry**: Any future date (e.g., 12/25)
   - **CVV**: Any 3 digits (e.g., 123)
   - **OTP**: Any 6 digits (e.g., 123456) if prompted

2. Click **Pay** and wait for redirect

### ✅ STEP 5: Check Browser Console After Redirect

After payment, you should see:
```
[UpgradePage] Checking for order_id in URL params: 48b8f5c2-...
[UpgradePage] Starting payment verification for order: 48b8f5c2-...
[UpgradePage] Verify payment response status: 200
[UpgradePage] Verify payment result: {success: true, status: "SUCCESS", plan: "Pro", error: null}
[UpgradePage] Payment successful! Updating subscription...
[UpgradePage] Updating Firestore subscription: {plan: "Pro", duration: "monthly", userId: "abc123"}
[UpgradePage] Successfully updated subscription in Firestore
```

### ✅ STEP 6: Check Vercel Function Logs - verify-payment

1. Go to **Vercel Dashboard** → Deployments → Latest
2. Go to **Functions** → `/api/verify-payment`
3. Look for logs:

```
[Verify Payment] Fetching order from Cashfree: https://sandbox.cashfree.com/pg/orders/48b8f5c2-...
[Verify Payment] Updated payment status to SUCCESS for order 48b8f5c2-...
[Verify Payment] Successfully updated subscription for user abc123
```

**If you see errors like:**
- "Payment gateway not configured" → Missing CASHFREE_SECRET_KEY
- "Payment record not found" → Order not saved in step 3
- "Failed to get payment status" → Wrong Cashfree credentials

### ✅ STEP 7: Check Firestore Collections

1. Go to **Firebase Console** → Your Project
2. Go to **Firestore Database**
3. Check these collections exist:

```
paymentHistory/
├── {order_id}
│   ├── userId: "abc123"
│   ├── amount: 827
│   ├── plan: "Pro"
│   ├── duration: "monthly"
│   ├── status: "SUCCESS" ← Should change from PENDING to SUCCESS
│   ├── transactionId: "cf_..."
│   └── paymentMethod: "card"

userSubscriptions/
├── {user_id}
│   ├── userId: "abc123"
│   ├── plan: "Pro" ← Should update after successful payment
│   ├── duration: "monthly"
│   ├── status: "active"
│   ├── startDate: (timestamp)
│   └── endDate: (timestamp + duration)
```

**If collections don't exist:**
- Create them manually in Firestore
- Make sure Firestore security rules allow writes from authenticated users

### ✅ STEP 8: Verify Payment Status Component Shows

After redirect, you should see a modal showing:
- ✅ "Payment Successful!" (green)
- Plan details
- "Download Again" button
- Modal auto-closes after showing

**If you see error message instead:**
- Check browser console for error details
- Check Vercel logs for the API error
- See troubleshooting section below

## Troubleshooting

### Issue: "Internal Server Error" when creating payment session

**Check:**
1. NEXT_PUBLIC_CASHFREE_APP_ID is set on Vercel
2. CASHFREE_SECRET_KEY is set on Vercel (not just locally)
3. Both are correct values from your Cashfree account
4. Vercel function logs show what the actual error is

**Solution:**
```bash
# On Vercel dashboard:
# Settings → Environment Variables
# Verify both Cashfree env vars are there and correct
# Redeploy the project (to apply new env vars)
```

### Issue: Redirects to `/upgrade?order_id=...` but nothing happens

**Possible causes:**
1. URL is wrong (NEXT_PUBLIC_BASE_URL_UPGRADE missing)
2. useEffect didn't trigger (check browser console)
3. Verify-payment API failing silently

**Check:**
```javascript
// In browser console, verify order_id is in URL:
const params = new URLSearchParams(window.location.search);
console.log("order_id:", params.get("order_id"));
// Should output: order_id: 48b8f5c2-...
```

### Issue: Payment record exists but subscription doesn't update

**Possible causes:**
1. Firestore rules don't allow writes to userSubscriptions
2. userId in paymentHistory doesn't match user.uid
3. Firebase credentials missing (GOOGLE_SERVICE_ACCOUNT_JSON)

**Check:**
```javascript
// In Firebase console:
// Firestore → firestore.rules
// Should have:
match /userSubscriptions/{document=**} {
  allow read, write: if request.auth != null;
}
```

### Issue: Logs show "[Verify Payment] Fetching order from Cashfree" but then nothing

**Likely cause:** Cashfree API call timing out or failing

**Check:**
1. CASHFREE_SECRET_KEY is correct
2. Network connectivity to Cashfree API
3. Vercel function timeout (should be fine, default is 10s)

**Solution:**
- Check Vercel function duration and logs
- Verify Cashfree credentials are correct
- Try redoing the payment

## Testing Without Real Cashfree Account

If you don't have Cashfree credentials yet, you can:

1. Sign up at: https://www.cashfree.com/
2. Complete KYC verification (required)
3. Go to Dashboard → API Keys
4. Get your App ID and Secret Key
5. Make sure you're using **Sandbox** (not production)

For local testing with mock data:
- Create a test .env.local with dummy values
- You'll get a 400 error but can see the request structure
- Once you have real credentials, just update .env vars

## Success Checklist

- [ ] Environment variables set on Vercel
- [ ] Can see "[PaymentModal]" logs in browser console
- [ ] Can see "[Create Payment Session]" logs in Vercel functions
- [ ] Cashfree form opens successfully
- [ ] Payment redirects to `/upgrade?order_id=...`
- [ ] Can see "[UpgradePage]" logs in browser console
- [ ] Can see "[Verify Payment]" logs in Vercel functions
- [ ] PaymentStatus modal shows success message
- [ ] userSubscriptions document updated in Firestore
- [ ] User's plan shows as "Pro" in the app

## Next: Monitor in Production

After fixing, watch for:
1. Real payments from users
2. Check Firestore to ensure subscriptions are updating
3. Monitor Vercel logs for any errors
4. Test with real payment methods (not just sandbox)

If issues persist, share the Vercel logs output from `/api/verify-payment` in the error message!
