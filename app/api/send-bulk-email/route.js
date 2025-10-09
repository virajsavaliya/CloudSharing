import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { emails, emailData } = await request.json();
    
    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid emails array' },
        { status: 400 }
      );
    }

    // Process all emails concurrently with Promise.all for maximum speed
    // The connection pooling in /api/send will handle rate limiting
    const emailPromises = emails.map(async (email) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...emailData,
            emailToSend: email
          })
        });
        
        const result = await response.json();
        
        return { 
          email, 
          status: result.success ? 'sent' : 'failed', 
          message: result.message || result.error 
        };
      } catch (error) {
        return { 
          email, 
          status: 'failed', 
          error: error.message 
        };
      }
    });
    
    // Wait for all emails to be dispatched (not necessarily sent, as /api/send returns immediately)
    const results = await Promise.all(emailPromises);
    
    const totalSent = results.filter(r => r.status === 'sent').length;
    const totalFailed = results.filter(r => r.status === 'failed').length;
    
    return NextResponse.json({
      success: true,
      results,
      totalSent,
      totalFailed,
      message: `Dispatched ${totalSent} emails successfully, ${totalFailed} failed`
    });
    
  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
