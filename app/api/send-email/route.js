import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const { to, subject, html, text } = await request.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and html/text" },
        { status: 400 }
      );
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("Email credentials not configured in environment variables");
      return NextResponse.json(
        { 
          error: "Email service not configured",
          details: "EMAIL_USER or EMAIL_PASSWORD missing in environment variables"
        },
        { status: 500 }
      );
    }

    console.log("[Email] Sending email to:", to);
    console.log("[Email] Using email account:", process.env.EMAIL_USER);

    // Gmail-specific configuration with connection pooling
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      pool: true, // Enable connection pooling
      maxConnections: 5, // Maximum concurrent connections
      maxMessages: 100, // Maximum messages per connection
      rateDelta: 1000, // Time window for rate limiting (1 second)
      rateLimit: 5, // Maximum messages per rateDelta
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("[Email] SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("[Email] SMTP verification failed:", verifyError.message);
      return NextResponse.json(
        {
          error: "Email service configuration error",
          details: verifyError.message,
          hint: "Check if EMAIL_USER and EMAIL_PASSWORD are correct, and App Password is enabled for Gmail"
        },
        { status: 500 }
      );
    }

    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'CloudSharing'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || text,
    });

    console.log("[Email] Email sent successfully:", info.messageId);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("[Email] Email sending failed:", error.message);
    console.error("[Email] Full error:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error.message,
      },
      { status: 500 }
      );
  }
}