// app/api/send/route.ts

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { EmailTemplate } from '../../_components/email-template';

// Ensure this transport is configured correctly.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // Must be the 16-digit App Password
  },
});

export async function POST(req) {
  const response = await req.json();

  try {
    const mailOptions = {
      from: `CloudShare <${process.env.GMAIL_USER}>`,
      to: response.emailToSend,
      subject: `${response.userName} shared a file with you`,
      html: EmailTemplate({ response }), // Using your hardened template logic
    };

    // This "await" is necessary for reliability.
    // It tells the server to wait until Google confirms the email is sent.
    // This is the direct cause of the slowness.
    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json(info);

  } catch (error) {
    // If Google's server fails or times out, the error will be caught here.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}