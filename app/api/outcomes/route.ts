import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple CRUD for the future outcomes feedback loop (Phase 4 of the mock
// interview spec). No aggregation logic here yet — just recording.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { job_title, company, outcome, resume_version_id } = await req.json()

  if (!outcome || typeof outcome !== 'string') {
    return NextResponse.json({ error: 'Missing outcome' }, { status: 400 })
  }

  const { data: row, error } = await supabase
    .from('application_outcomes')
    .insert({
      user_id: claims.sub,
      job_title: typeof job_title === 'string' ? job_title : null,
      company: typeof company === 'string' ? company : null,
      outcome,
      resume_version_id: typeof resume_version_id === 'string' ? resume_version_id : null,
      source: 'manual',
    })
    .select('id')
    .single()

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'Could not save outcome' }, { status: 500 })
  }

  return NextResponse.json({ id: row.id })
}
