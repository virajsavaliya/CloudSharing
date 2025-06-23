//router.ts
import { NextResponse } from 'next/server';
import { EmailTemplate } from '../../_components/email-template';
import nodemailer from 'nodemailer';


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
      from: 'cloudsharing.fileshare@gmail.com',
      to: response.emailToSend,
      subject: `${response.userName} shared a file with you`,
      html: EmailTemplate({ response }),
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json(info);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}