import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Edge Proxy: End-to-end route shielding and session validation before hitting the Node.js server
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Initialize Supabase SSR client for Edge Runtime
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session and fetch the current user state at the Edge
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Phase 1: Unauthenticated Routing Guard
  if (!user) {
    const publicRoutes = ['/', '/login', '/crm/login']

    if (!publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else {
    // Phase 2: Authenticated Routing & Role-Based Access Control (RBAC)
    if (pathname.startsWith('/cadastro')) {
      
      // Senior Practice: Fetching roles from Env Variables instead of hardcoding sensitive emails
      const adminEmails = process.env.ADMIN_ALLOWED_EMAILS?.split(',') || []

      // Edge Security Audit Logs
      console.log("[EDGE PROXY] === TENANT PROVISIONING ACCESS ATTEMPT ===")
      console.log("[EDGE PROXY] Target URL:", pathname)
      console.log("[EDGE PROXY] Authenticated User:", user.email)

      if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
        console.log("[EDGE PROXY] 🚨 ALERT: UNAUTHORIZED ACCESS. Forcing redirect to Dashboard.")
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        console.log("[EDGE PROXY] ✅ SUCCESS: ADMIN CLEARANCE GRANTED.")
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
