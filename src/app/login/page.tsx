'use client'

import { login } from './actions'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  useEffect(() => {
    // If a PKCE code was passed to /login (e.g. from an invite link)
    if (code) {
      const nextParam = type === 'invite' || type === 'recovery' ? '&next=/reset-password' : ''
      router.push(`/auth/callback?code=${code}${nextParam}`)
      return
    }

    // If an implicit token hash is in the URL (e.g. #access_token=...&type=invite)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash
      if (hash.includes('type=invite') || hash.includes('type=recovery')) {
        router.push('/reset-password' + hash)
      }
    }
  }, [code, type, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-black dark:text-white">
            Clarity
          </h2>
          <p className="mt-3 text-sm text-gray-500 font-medium">
            Insightful spending, elegantly visualized.
          </p>
        </div>

        <form className="mt-8 space-y-4" action={login}>
          <div className="space-y-2">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 dark:border-white/10 placeholder-gray-400 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent sm:text-sm bg-gray-50/50 dark:bg-neutral-900/50"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 dark:border-white/10 placeholder-gray-400 text-gray-900 dark:text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent sm:text-sm bg-gray-50/50 dark:bg-neutral-900/50"
                placeholder="Password"
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
