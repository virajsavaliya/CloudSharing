import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiting (no external dependency)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) {
      rateLimit.delete(key)
    }
  }
}, 60000)

export async function middleware(request: NextRequest) {
    // Handle missing ReactToastify source maps to prevent 404 errors
  if (request.nextUrl.pathname.includes('ReactToastify.css.map') ||
      request.nextUrl.pathname.includes('react-toastify.esm.mjs.map')) {
    return new NextResponse('{"version":3,"sources":[],"names":[],"mappings":"","file":""}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  // Basic security headers
  const headers = new Headers({
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'Permissions-Policy': 'camera=*, microphone=*, display-capture=*, geolocation=(), interest-cohort=()'
  })

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Get IP from headers (works with Vercel and other platforms)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'anonymous'
    
    const now = Date.now()
    const userLimit = rateLimit.get(ip)

    if (userLimit && now < userLimit.resetTime) {
      if (userLimit.count >= 100) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests' }),
          { 
            status: 429, 
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60'
            }
          }
        )
      }
      userLimit.count++
    } else {
      rateLimit.set(ip, { count: 1, resetTime: now + 60000 })
    }
  }

  // Return response with security headers
  const response = NextResponse.next()
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths including _next static files for source maps
     */
    '/:path*'
  ],
}
