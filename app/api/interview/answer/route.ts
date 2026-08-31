import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runInterviewStep, type ChatTurn, type PrepResult } from '@/lib/interview'

// Maps the LLM's internal action to the public API contract from the spec.
const ACTION_TO_TYPE: Record<string, string> = {
  follow_up: 'follow_up',
  next_question: 'question',
  conclude: 'ready_to_finish',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { session_id, answer } = await req.json()

  if (!session_id || typeof session_id !== 'string' || !answer || typeof answer !== 'string') {
    return NextResponse.json({ error: 'Missing session_id or answer' }, { status: 400 })
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('id, role_criteria, role_pain, red_flags, status')
      .eq('id', session_id)
      .eq('user_id', claims.sub)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 })
    }

    if (session.status !== 'active') {
      return NextResponse.json({ error: 'This interview has already finished' }, { status: 400 })
    }

    const { data: existingTurns, error: turnsError } = await supabase
      .from('interview_turns')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (turnsError) {
      throw new Error(turnsError.message)
    }

    await supabase.from('interview_turns').insert({
      session_id,
      role: 'candidate',
      content: answer,
      turn_type: 'answer',
    })

    const prep: PrepResult = {
      role_criteria: session.role_criteria ?? [],
      role_pain: session.role_pain ?? '',
      red_flags: session.red_flags ?? [],
    }

    const turns: ChatTurn[] = [
      ...(existingTurns ?? []).map((t) => ({ role: t.role as ChatTurn['role'], content: t.content })),
      { role: 'candidate' as const, content: answer },
    ]

    const step = await runInterviewStep(prep, turns)

    await supabase.from('interview_turns').insert({
      session_id,
      role: 'interviewer',
      content: step.message,
      turn_type: step.action === 'follow_up' ? 'follow_up' : 'question',
    })

    return NextResponse.json({ type: ACTION_TO_TYPE[step.action] ?? step.action, message: step.message })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('interview answer error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
