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

  // STRICT ENFORCEMENT: ashwin.gangakhedkar@dentsu.com OR user_metadata.mfa_required
  const is2FARequired = user && (
    user.email?.toLowerCase().trim() === 'ashwin.gangakhedkar@dentsu.com' ||
    user.user_metadata?.mfa_required === true
  );

  if (is2FARequired) {
    // Exclude auth routes from intercept to prevent infinite loops
    if (!request.nextUrl.pathname.startsWith('/auth/')) {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: mfa } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(session?.access_token)
      
      // If the user hasn't passed the TOTP challenge for this session (aal2)
      if (mfa?.currentLevel !== 'aal2') {
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const origin = `${protocol}://${host}`
        
        const redirectResponse = NextResponse.redirect(new URL('/auth/mfa', origin))
        
        // Preserve all cookies from supabaseResponse onto redirectResponse
        supabaseResponse.cookies.getAll().forEach((c) => {
          redirectResponse.cookies.set(c.name, c.value, c)
        })
        
        return redirectResponse
      }
    }
  }

  return supabaseResponse
}
