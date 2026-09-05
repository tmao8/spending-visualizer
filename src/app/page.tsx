import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

interface IndexPageProps {
  searchParams?: Promise<{ code?: string; token_hash?: string; type?: string; next?: string }>
}

export default async function IndexPage({ searchParams }: IndexPageProps) {
  const params = searchParams ? await searchParams : {}

  if (params?.token_hash) {
    const nextParam = params.next
      ? `&next=${encodeURIComponent(params.next)}`
      : params.type === 'invite' || params.type === 'recovery'
      ? '&next=/reset-password'
      : ''
    return redirect(`/auth/callback?token_hash=${params.token_hash}&type=${params.type || 'invite'}${nextParam}`)
  }

  // If Supabase redirects an invite/recovery/oauth code to the site URL, forward to auth callback
  if (params?.code) {
    const nextParam = params.next
      ? `&next=${encodeURIComponent(params.next)}`
      : params.type === 'invite' || params.type === 'recovery'
      ? '&next=/reset-password'
      : ''
    return redirect(`/auth/callback?code=${params.code}${nextParam}`)
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect('/dashboard')
  }

  return redirect('/login')
}
