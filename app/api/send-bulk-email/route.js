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
          // Your existing email sending logic here
          const response = await sendEmailFunction({
            ...emailData,
            emailToSend: email
          });
          
          return { email, status: 'sent', response };
        } catch (error) {
          return { email, status: 'failed', error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      totalSent: results.filter(r => r.value?.status === 'sent').length
    });
    
  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
