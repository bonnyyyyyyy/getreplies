import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUsageStatus, FREE_RESUME_LIMIT } from '@/lib/usage'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    return NextResponse.json({ signedIn: false, freeLimit: FREE_RESUME_LIMIT })
  }

  const status = await getUsageStatus(supabase, claims.sub)
  return NextResponse.json({ signedIn: true, ...status })
}
