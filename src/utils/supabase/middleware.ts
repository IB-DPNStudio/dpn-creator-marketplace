import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token and getting user
  const { data: { user } } = await supabase.auth.getUser()

  // STRICT ENFORCEMENT: Only intercept ashwin.gangakhedkar@dentsu.com
  if (user && user.email?.toLowerCase().trim() === 'ashwin.gangakhedkar@dentsu.com') {
    // Exclude auth routes from intercept to prevent infinite loops
    if (!request.nextUrl.pathname.startsWith('/auth/')) {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: mfa } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(session?.access_token)
      
      // If the user hasn't passed the TOTP challenge for this session (aal2)
      if (mfa?.currentLevel !== 'aal2') {
        // Force redirect to MFA challenge screen
        return NextResponse.redirect(new URL('/auth/mfa', request.url))
      }
    }
  }

  return supabaseResponse
}
