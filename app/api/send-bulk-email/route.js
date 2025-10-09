import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { emails, emailData } = await request.json();
    
    // Process emails in batches of 5 to avoid overwhelming the server
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (email) => {
        try {
          // Send email through the /api/send endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send`, {
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
          
          return { email, status: result.success ? 'sent' : 'failed', response: result };
        } catch (error) {
          return { email, status: 'failed', error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value));
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const totalSent = results.filter(r => r.status === 'sent').length;
    
    return NextResponse.json({
      success: true,
      results,
      totalSent
    });
    
  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
