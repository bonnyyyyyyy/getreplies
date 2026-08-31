import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runPrep, runInterviewStep } from '@/lib/interview'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { job_description, resume_text } = await req.json()

  if (
    !job_description || typeof job_description !== 'string' ||
    !resume_text || typeof resume_text !== 'string'
  ) {
    return NextResponse.json({ error: 'Missing job_description or resume_text' }, { status: 400 })
  }

  try {
    const prep = await runPrep(job_description, resume_text)

    const { data: session, error } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: claims.sub,
        resume_text,
        job_description,
        role_criteria: prep.role_criteria,
        role_pain: prep.role_pain,
        red_flags: prep.red_flags,
        status: 'active',
      })
      .select('id')
      .single()

    if (error || !session) {
      throw new Error(error?.message ?? 'Could not create interview session')
    }

    const opening = await runInterviewStep(prep, [])

    await supabase.from('interview_turns').insert({
      session_id: session.id,
      role: 'interviewer',
      content: opening.message,
      turn_type: opening.action === 'follow_up' ? 'follow_up' : 'question',
    })

    return NextResponse.json({ session_id: session.id, first_question: opening.message })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('interview start error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
