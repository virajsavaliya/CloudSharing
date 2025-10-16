// File: app/api/cron/subscription-check/route.js

import { NextResponse } from "next/server";
import { SubscriptionManager } from "../../../../lib/SubscriptionManager";

export async function GET() {
  try {
    // Check for expired subscriptions and downgrade users
    const expiredUsers = await SubscriptionManager.checkExpiredSubscriptions();
    console.log(`Processed ${expiredUsers.length} expired subscriptions`);

    // Send expiration reminders
    await SubscriptionManager.sendExpirationReminders();
    console.log('Sent expiration reminders');

    return NextResponse.json({
      success: true,
      expiredSubscriptions: expiredUsers.length,
      message: 'Subscription check completed successfully'
    });

  } catch (error) {
    console.error("[Subscription Cron Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Only allow GET requests for cron jobs
export async function POST() {
  return NextResponse.json({ success: false, error: "Method not allowed" }, { status: 405 });
}