# 🎯 Payment Upgrade - Reference Card

## The 3 Critical Problems

| # | Problem | Impact | Fixed? |
|---|---------|--------|--------|
| 1 | **Broken Return URL** | Payment redirects to wrong page | ✅ |
| 2 | **No Error Logging** | Can't debug failures | ✅ |
| 3 | **Subscription not updating** | User plan never upgrades | ✅ |

## The Fix in 60 Seconds

```javascript
// BEFORE: Broken
return_url: `${NEXT_PUBLIC_BASE_URL_UPGRADE}upgrade?order_id={order_id}`
// Could be: https://yourapp.vercel.appupgrade ❌

// AFTER: Fixed
return_url: `${NEXT_PUBLIC_BASE_URL_UPGRADE}${
  NEXT_PUBLIC_BASE_URL_UPGRADE?.endsWith('/') ? '' : '/'
}upgrade?order_id={order_id}`
// Always: https://yourapp.vercel.app/upgrade ✅

// BEFORE: No subscription update
if (finalStatus === 'SUCCESS') {
  // ... do nothing
}

// AFTER: Updates subscription
if (finalStatus === 'SUCCESS') {
  await adminDb.collection('userSubscriptions').doc(userId).set({
    plan, duration, endDate, status: 'active'
  }, { merge: true });
}
```

## 3 Steps to Fix

### 1️⃣ Vercel Environment Variables
```bash
NEXT_PUBLIC_CASHFREE_APP_ID = your_id
CASHFREE_SECRET_KEY = your_secret
GOOGLE_SERVICE_ACCOUNT_JSON = {...}
NEXT_PUBLIC_BASE_URL_UPGRADE = https://yourapp.vercel.app/
```

### 2️⃣ Redeploy Vercel
- Deployments → Latest → Redeploy

### 3️⃣ Test
- Go to `/upgrade`
- Try payment flow
- Check browser console for logs

## What Logs Should Show

```javascript
// ✅ SUCCESS Flow:
[PaymentModal] Creating payment session for: {amount: 827, planName: "Pro"}
[Create Payment Session] Received request: {amount: 827, ...}
[Create Payment Session] Calling Cashfree API...
[Create Payment Session] Success! Session ID: abc123...
[PaymentModal] Got session ID: abc123...
// User pays here...
[UpgradePage] Checking for order_id in URL params: abc123...
[Verify Payment] Fetching order from Cashfree...
[Verify Payment] Updated payment status to SUCCESS
[Verify Payment] Successfully updated subscription
[UpgradePage] Payment successful! Updating subscription...
[UpgradePage] Successfully updated subscription in Firestore
// Modal shows: "Payment Successful!" ✅

// ❌ ERROR Flow:
[Create Payment Session] Missing customer data
// OR
[Verify Payment] Payment gateway not configured
// OR
[Verify Payment] Payment record not found
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `[Create Payment Session] Missing customer data` | User not passed | Reload page, try again |
| `Payment gateway not configured` | CASHFREE_SECRET_KEY missing | Add to Vercel env vars |
| `Payment record not found` | Firestore write failed | Check Firebase credentials |
| URL is `https://yourapp.vercel.appupgrade` | NEXT_PUBLIC_BASE_URL_UPGRADE missing `/` | Add trailing slash |
| Nothing happens after redirect | No order_id in URL | Check Cashfree return URL |

## Files Changed

```
✅ app/api/create-payment-session/route.js
   - Line 48: Fixed return URL
   - Lines 13-16: Added logging

✅ app/api/verify-payment/route.js
   - Lines 58-88: Added subscription update
   - Lines 10-18: Added validation

✅ app/(dashboard)/(router)/upgrade/_components/PaymentModal.js
   - Lines 52-73: Fixed return URL + added logging

✅ app/(dashboard)/(router)/upgrade/page.js
   - Lines 101-140: Added verification logging
   - Lines 78-96: Added Firebase update logging
```

## Quick Checklist

Before Testing:
- [ ] Set 4 env vars on Vercel
- [ ] Redeploy Vercel
- [ ] Browser DevTools (F12) ready
- [ ] Vercel Functions logs tab open

During Testing:
- [ ] Can see [PaymentModal] logs
- [ ] Can see [Create Payment Session] logs
- [ ] Cashfree form appears
- [ ] Can see [UpgradePage] logs after redirect
- [ ] Can see [Verify Payment] logs

After Testing:
- [ ] See "Payment Successful!" modal
- [ ] No error messages
- [ ] Firestore updated (paymentHistory + userSubscriptions)
- [ ] User's plan changed in app

## Debug URLs

```bash
# Local
http://localhost:3000/upgrade

# Vercel  
https://yourapp.vercel.app/upgrade

# Firestore
Firebase Console → projectname → Firestore Database
paymentHistory/{order_id}
userSubscriptions/{user_id}

# Vercel Logs
Vercel Dashboard → Deployments → Latest → Functions
/api/create-payment-session
/api/verify-payment
```

## The Payment Flow

```
1. Click Upgrade
   ↓
2. PaymentModal → getSessionId() → /api/create-payment-session
   Returns: payment_session_id
   ↓
3. Cashfree.checkout() opens payment form
   ↓
4. User pays (test: 4111111111111111)
   ↓
5. Redirects to /upgrade?order_id=...
   ↓
6. useEffect triggers → /api/verify-payment
   Updates: paymentHistory + userSubscriptions
   ↓
7. Frontend gets response → Shows PaymentStatus modal
   ↓
8. Done! User sees new plan
```

## API Response Examples

### ✅ Create Payment Session - SUCCESS
```json
{
  "success": true,
  "payment_session_id": "48b8f5c2-1234-5678-abcd-ef0123456789"
}
```

### ✅ Verify Payment - SUCCESS
```json
{
  "success": true,
  "paymentData": {
    "orderId": "48b8f5c2-...",
    "plan": "Pro",
    "duration": "monthly",
    "amount": 827,
    "status": "SUCCESS",
    "transactionId": "cf_123456",
    "paymentMethod": "card"
  }
}
```

### ❌ Error Response
```json
{
  "success": false,
  "error": "Payment gateway not configured. Please contact support."
}
```

## Environment Variables Explained

```bash
# Public - visible in frontend code, safe to expose
NEXT_PUBLIC_CASHFREE_APP_ID=cf_prod_1234...
NEXT_PUBLIC_BASE_URL_UPGRADE=https://yourapp.vercel.app/

# Secret - only used on server, MUST be kept private
CASHFREE_SECRET_KEY=cf_secret_key_xyz...
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

## Next Steps

1. Read `/QUICK_ACTION_GUIDE.md` (2 min read)
2. Set Vercel environment variables (5 min)
3. Redeploy Vercel (2 min)
4. Test payment flow (10 min)
5. Check logs to verify it worked (5 min)

**Total time: ~25 minutes**

---

**Still stuck?** See the detailed debugging guide: `/PAYMENT_UPGRADE_DEBUGGING_STEPS.md`
