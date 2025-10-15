import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { LRUCache } from 'lru-cache'

// Rate limiting configuration
const rateLimit = new LRUCache({
  max: 500,
  ttl: 60 * 1000, // 1 minute
})

export async function middleware(request: NextRequest) {
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
    const ip = request.ip ?? 'anonymous'
    const tokenCount = rateLimit.get(ip) as number ?? 0

    if (tokenCount >= 100) {
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

    rateLimit.set(ip, tokenCount + 1)
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
     * Match all request paths except:
     * 1. /api/auth/* (authentication routes)
     * 2. /_next/* (Next.js internals)
     * 3. /*.* (static files)
     */
    '/((?!api/auth|_next|[\\w-]+\\.\\w+).*)',
    '/api/((?!auth).*)'
  ],
}
