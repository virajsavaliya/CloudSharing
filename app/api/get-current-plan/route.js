// File: app/api/get-current-plan/route.js

import { NextResponse } from "next/server";
import { SubscriptionManager } from "../../../lib/SubscriptionManager";

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    const planInfo = await SubscriptionManager.getCurrentPlan(userId);

    return NextResponse.json({ success: true, planInfo });

  } catch (error) {
    console.error("[Get Current Plan Error]:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}