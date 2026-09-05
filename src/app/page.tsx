import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

interface IndexPageProps {
  searchParams?: Promise<{ code?: string; type?: string; next?: string }>
}

export default async function IndexPage({ searchParams }: IndexPageProps) {
  const params = searchParams ? await searchParams : {}

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
