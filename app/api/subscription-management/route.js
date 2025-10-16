// File: app/api/subscription-management/route.js

import { NextResponse } from "next/server";
import { SubscriptionManager } from "../../../lib/SubscriptionManager";

export async function POST(req) {
  try {
    const { action } = await req.json();

    switch (action) {
      case 'check-expirations':
        const expiredUsers = await SubscriptionManager.checkExpiredSubscriptions();
        return NextResponse.json({
          success: true,
          expiredUsers,
          message: `Checked ${expiredUsers.length} expired subscriptions`
        });

      case 'send-reminders':
        await SubscriptionManager.sendExpirationReminders();
        return NextResponse.json({
          success: true,
          message: 'Expiration reminders sent successfully'
        });

      case 'get-plan':
        const { userId } = await req.json();
        if (!userId) {
          return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
        }
        const planInfo = await SubscriptionManager.getCurrentPlan(userId);
        return NextResponse.json({ success: true, planInfo });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error("[Subscription Management Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}