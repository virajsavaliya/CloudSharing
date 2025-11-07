import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Handle two formats:
    // 1. Direct email format: { to, subject, html, text }
    // 2. File sharing format: { emailToSend, userName, fileName, shortUrl, ... }
    
    let to, subject, html, text;
    
    if (body.emailToSend) {
      // File sharing format
      console.log('[Email] Processing file sharing email:', body.emailToSend);
      to = body.emailToSend;
      subject = `${body.userName} shared "${body.fileName}" with you`;
      
      // Create HTML email content
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .file-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📁 File Shared With You</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              <p><strong>${body.userName}</strong> has shared a file with you on CloudSharing.</p>
              
              <div class="file-info">
                <h3>📄 ${body.fileName}</h3>
                <p><strong>File Type:</strong> ${body.fileType}</p>
                <p><strong>Size:</strong> ${(body.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Shared by:</strong> ${body.userEmail}</p>
              </div>
              
              <a href="${body.shortUrl}" class="button">📥 Download File</a>
              
              <p style="color: #666; font-size: 14px;">Or copy this link: <br><a href="${body.shortUrl}">${body.shortUrl}</a></p>
              
              <div class="footer">
                <p>This file was shared via CloudSharing</p>
                <p>© ${new Date().getFullYear()} CloudSharing. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      text = `${body.userName} shared "${body.fileName}" with you. Download it here: ${body.shortUrl}`;
    } else {
      // Direct email format
      console.log('[Email] Processing direct email format:', body.to);
      to = body.to;
      subject = body.subject;
      html = body.html;
      text = body.text;
    }

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      console.error('[Email] Missing required fields:', { to: !!to, subject: !!subject, html: !!html, text: !!text });
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and html/text" },
        { status: 400 }
      );
    }
    
    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('[Email] Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env.local');
      return NextResponse.json(
        { 
          error: "Email service not configured",
          details: "Please configure EMAIL_USER and EMAIL_PASSWORD environment variables. See EMAIL_SETUP.md for instructions."
        },
        { status: 500 }
      );
    }

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
    
    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('[Email] SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('[Email] SMTP verification failed:', verifyError.message);
      return NextResponse.json(
        { 
          error: "SMTP connection failed",
          details: "Please verify your Gmail App Password is correct. See EMAIL_SETUP.md for instructions."
        },
        { status: 500 }
      );
    }

    console.log(`[Email] Sending email to: ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    
    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'CloudSharing'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || text,
    });

    console.log(`[Email] Email sent successfully: ${info.messageId}`);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("[Email] Email sending failed:", error.message);
    console.error("[Email] Error details:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
