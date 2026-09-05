'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { updatePasswordAction } from './actions'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    async function establishSession() {
      try {
        // 1. Check for PKCE code in query params (?code=...)
        const code = searchParams.get('code')
        if (code) {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)
          if (!exchangeErr && data.user?.email) {
            if (isMounted) setUserEmail(data.user.email)
            return
          }
        }

        // 2. Check for token_hash in query params (?token_hash=...&type=...)
        const tokenHash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        if (tokenHash) {
          const { data, error: otpErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (type || 'invite') as any,
          })
          if (!otpErr && data.user?.email) {
            if (isMounted) setUserEmail(data.user.email)
            return
          }
        }

        // 3. Check for implicit token hash in URL fragment (#access_token=...&refresh_token=...)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          if (accessToken && refreshToken) {
            const { data, error: sessionErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (!sessionErr && data.user?.email) {
              if (isMounted) setUserEmail(data.user.email)
              return
            }
          }
        }

        // 4. Check existing session from cookies
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email && isMounted) {
          setUserEmail(user.email)
        }
      } catch (err: any) {
        console.error('Session initialization error:', err)
      } finally {
        if (isMounted) setVerifying(false)
      }
    }

    establishSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email && isMounted) {
        setUserEmail(session.user.email)
        setVerifying(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // First attempt: Update password via client
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (!updateError) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    // Second attempt fallback: If client session had sync delay, try Server Action
    const serverResult = await updatePasswordAction(password)
    if (serverResult?.success) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    // Display user-friendly error
    const finalErrorMessage = serverResult?.error || updateError.message
    if (finalErrorMessage.toLowerCase().includes('session missing')) {
      setError('Your authentication session has expired or is missing. Please click the link in your email again.')
    } else {
      setError(finalErrorMessage)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-black dark:text-white">
            Set Password
          </h2>
          <p className="mt-3 text-sm text-gray-500 font-medium">
            {userEmail
              ? `Create a password for ${userEmail}`
              : 'Create a password to access your account.'}
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 dark:border-white/10 placeholder-gray-400 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent sm:text-sm bg-gray-50/50 dark:bg-neutral-900/50"
                placeholder="New password (min. 6 characters)"
              />
            </div>
            <div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 dark:border-white/10 placeholder-gray-400 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent sm:text-sm bg-gray-50/50 dark:bg-neutral-900/50"
                placeholder="Confirm password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-red-950/30 py-2.5 px-3 rounded-xl border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || verifying}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50"
            >
              {loading ? 'Saving...' : verifying ? 'Verifying link...' : 'Set Password & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
