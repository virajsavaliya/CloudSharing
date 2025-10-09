// File: app/api/send/route.ts

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { EmailTemplate } from '../../_components/email-template';

// Create transporter with connection pooling for better performance
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  pool: true, // Enable connection pooling
  maxConnections: 5, // Maximum concurrent connections
  maxMessages: 100, // Maximum messages per connection
  rateDelta: 1000, // Time window for rate limiting (1 second)
  rateLimit: 5, // Maximum messages per rateDelta
});

export async function POST(req) {
  const response = await req.json();

  try {
    const mailOptions = {
      from: `CloudShare <${process.env.GMAIL_USER}>`,
      to: response.emailToSend,
      subject: `${response.userName} shared a file with you`,
      html: EmailTemplate({ response }),
    };

    // Use promise-based sending for better async handling
    transporter.sendMail(mailOptions)
      .then((info) => {
        console.log("Email sent:", info.messageId);
      })
      .catch((error) => {
        console.error("Nodemailer error:", error);
      });

    // Return an immediate success response to the client
    return NextResponse.json({ success: true, message: "Email sent successfully in the background." });

  } catch (error) {
    console.error("API POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}