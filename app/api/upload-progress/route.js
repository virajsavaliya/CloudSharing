import { NextResponse } from "next/server";
import Ably from "ably";

export async function POST(request) {
  try {
    if (!process.env.ABLY_API_KEY) {
      return NextResponse.json(
        { error: "ABLY_API_KEY environment variable not set" },
        { status: 500 }
      );
    }

    const { userId, fileId, progress, status } = await request.json();
    const ably = new Ably.Rest(process.env.ABLY_API_KEY);
    const channel = ably.channels.get(`upload-${userId}`);

    await channel.publish("upload-progress", {
      fileId,
      progress,
      status
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload progress update error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}