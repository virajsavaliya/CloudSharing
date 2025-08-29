// File: app/api/send/route.ts

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { EmailTemplate } from '../../_components/email-template';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
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

    // Send the email without waiting for confirmation
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Nodemailer error:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    // Return an immediate success response to the client
    return NextResponse.json({ success: true, message: "Email sent successfully in the background." });

  } catch (error) {
    console.error("API POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}