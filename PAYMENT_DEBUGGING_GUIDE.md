# Payment Upgrade Issue - Debugging & Fix Guide

## Problem Summary
When completing payment on Vercel and trying to upgrade the plan, you're getting:
```
Failed to load resource: the server responded with a status of 500 ()
Internal Server Error
```

## Root Causes Identified

### 1. ⚠️ **Missing Environment Variables on Vercel**
The most common cause is missing or incorrectly configured environment variables.

**Required Environment Variables:**
- `NEXT_PUBLIC_CASHFREE_APP_ID` - Your Cashfree App ID (public, safe to expose)
- `CASHFREE_SECRET_KEY` - Your Cashfree Secret Key (PRIVATE, must be set on Vercel)
- `GOOGLE_SERVICE_ACCOUNT_JSON` - Firebase Admin SDK credentials (PRIVATE)
- `NEXT_PUBLIC_BASE_URL_UPGRADE` - Your Vercel deployment URL (e.g., `https://yourapp.vercel.app/`)

### 2. ✅ **Fixes Applied to Code**

#### Fixed `app/api/verify-payment/route.js`:
1. **Added Environment Variable Validation** - Checks if Cashfree credentials exist before making API calls
2. **Enhanced Error Logging** - Now logs the actual error instead of generic "Internal Server Error"
3. **Better Data Validation** - Validates payment data before processing
4. **Improved Subscription Update** - Properly updates `userSubscriptions` collection when payment succeeds
5. **Added Try-Catch for Subscription Update** - Wraps subscription update in try-catch to catch specific errors

#### New Error Messages:
- If Cashfree credentials missing: "Payment gateway not configured. Please contact support."
- If payment record not found: "Payment record not found. Please contact support with your order ID."
- If plan data missing: "Plan information is incomplete. Please contact support."
- Real error details are now logged to Vercel console

## How to Fix (Step-by-Step)

### Step 1: Set Environment Variables on Vercel

1. Go to your **Vercel Dashboard**
2. Select your **CloudSharing project**
3. Go to **Settings → Environment Variables**
4. Add/Update the following:

```
NEXT_PUBLIC_CASHFREE_APP_ID = <your_cashfree_app_id>
CASHFREE_SECRET_KEY = <your_cashfree_secret_key>
GOOGLE_SERVICE_ACCOUNT_JSON = <your_firebase_admin_json_as_string>
NEXT_PUBLIC_BASE_URL_UPGRADE = https://yourapp.vercel.app/
```

**Note:** `GOOGLE_SERVICE_ACCOUNT_JSON` should be the entire JSON content converted to a single line string.

### Step 2: Get Your Firebase Service Account JSON

1. Go to **Firebase Console**
2. Select your project
3. Go to **Project Settings → Service Accounts**
4. Click **Generate New Private Key**
5. The JSON file will download
6. Convert it to a single-line string (removing all newlines)

Example:
```
{"type":"service_account","project_id":"your-project",...}
```

### Step 3: Test Locally First

```bash
# Add environment variables to .env.local locally
NEXT_PUBLIC_CASHFREE_APP_ID=your_id
CASHFREE_SECRET_KEY=your_secret
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
NEXT_PUBLIC_BASE_URL_UPGRADE=http://localhost:3000/

# Test payment flow
npm run dev
```

### Step 4: Redeploy on Vercel

After setting environment variables:
1. Go to **Deployments**
2. Click the **three dots** on the latest deployment
3. Select **Redeploy** (to pick up new env vars)

### Step 5: Check Vercel Logs

After payment attempt, check logs:
1. Go to **Deployments → Your Latest Deployment**
2. Go to **Functions** tab
3. Click on `/api/verify-payment`
4. Look for error messages like:
   - "Payment gateway not configured"
   - "Payment record not found"
   - Actual error details from Firebase/Cashfree

## What Happens During Payment

```
1. User clicks "Upgrade Plan"
   ↓
2. PaymentModal Component created with plan details
   ↓
3. /api/create-payment-session called
   - Creates paymentHistory record in Firestore
   - Calls Cashfree API to create payment session
   - Returns session_id
   ↓
4. Cashfree SDK opens payment form
   ↓
5. User completes payment on Cashfree
   ↓
6. Cashfree redirects to: /upgrade?order_id={order_id}
   ↓
7. /api/verify-payment called with order_id
   - Fetches payment status from Cashfree
   - Updates paymentHistory record status
   - **UPDATES userSubscriptions** ← This was failing!
   ↓
8. Frontend receives response with paymentData
   ↓
9. Shows PaymentStatus component with success/failure
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Internal Server Error" | Missing env vars | Set Cashfree credentials on Vercel |
| Payment record not found | paymentHistory not created | Check Firebase Firestore → paymentHistory collection |
| Subscription not updating | AdminDB credentials issue | Verify GOOGLE_SERVICE_ACCOUNT_JSON is set correctly |
| "Failed to get payment status" | Cashfree API key wrong | Verify NEXT_PUBLIC_CASHFREE_APP_ID and CASHFREE_SECRET_KEY |
| Plan not upgrading after success | userSubscriptions write failed | Check Firestore rules allow writing to userSubscriptions |

## Firestore Security Rules Check

Make sure your `/firestore.rules` allows:

```javascript
match /paymentHistory/{document=**} {
  allow read, write: if request.auth != null;
}

match /userSubscriptions/{document=**} {
  allow read, write: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}
```

## Testing Checklist

- [ ] Environment variables set on Vercel
- [ ] Local `.env.local` has all required variables
- [ ] Local testing works: `npm run dev`
- [ ] Can see detailed logs in Vercel console
- [ ] Payment appears in Firestore paymentHistory collection
- [ ] userSubscriptions document updates after payment
- [ ] Frontend shows success message
- [ ] User's plan actually upgrades in app

## Next Steps

1. ✅ Apply the code fixes (already done)
2. Set environment variables on Vercel (see Step 1 above)
3. Redeploy the application
4. Test payment flow again
5. Check Vercel logs for detailed error messages
6. Contact support with the error details from logs if still failing
