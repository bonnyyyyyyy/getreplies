'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  return { user, loading }
}

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSignIn = async () => {
    if (!email.trim()) return
    setError('')
    setSending(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setSending(false)

    if (error) {
      setError(error.message)
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <p className="text-sm text-[#888] text-center max-w-sm">
        Check your inbox — we sent a sign-in link to <span className="text-white">{email}</span>.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      <p className="text-xs text-[#666] tracking-widest text-center">SIGN IN TO FIND VACANCIES</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-4 py-2.5 text-white placeholder-[#333] text-sm focus:outline-none focus:border-[#333]"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSignIn}
        disabled={sending || !email.trim()}
        className="px-8 py-2.5 bg-white text-black text-xs font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {sending ? 'SENDING...' : 'SEND MAGIC LINK'}
      </button>
    </div>
  )
}
