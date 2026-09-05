import { type EmailOtpType } from '@supabase/supabase-js'
import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const defaultNext = type === 'invite' || type === 'recovery' ? '/reset-password' : '/dashboard'
  const next = searchParams.get('next') ?? defaultNext

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const targetOrigin = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin)
  const redirectUrl = `${targetOrigin}${next}`

  let response = NextResponse.redirect(redirectUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return response
    }
    return NextResponse.redirect(`${targetOrigin}/login?error=${encodeURIComponent(error.message)}`)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    return NextResponse.redirect(`${targetOrigin}/login?error=${encodeURIComponent(error.message)}`)
  }

  // Return to login with error if no code or token provided
  return NextResponse.redirect(`${targetOrigin}/login?error=Invalid+authentication+link`)
}
