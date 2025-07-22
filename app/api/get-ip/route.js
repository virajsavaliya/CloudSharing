// app/api/get-ip/route.js

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request) {
  // Vercel provides the user's IP in the 'x-forwarded-for' header.
  const ip = headers().get('x-forwarded-for')?.split(',')[0].trim() || 
             request.ip; // Fallback for local development

  if (!ip) {
    return NextResponse.json({ error: 'Could not determine IP address' }, { status: 500 });
  }

  return NextResponse.json({ ip });
}