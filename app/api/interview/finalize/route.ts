import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runEvaluation, type ChatTurn, type PrepResult } from '@/lib/interview'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { session_id } = await req.json()

  if (!session_id || typeof session_id !== 'string') {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('id, role_criteria, role_pain, red_flags')
      .eq('id', session_id)
      .eq('user_id', claims.sub)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Interview session not found' }, { status: 404 })
    }

    const { data: existingTurns, error: turnsError } = await supabase
      .from('interview_turns')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (turnsError) {
      throw new Error(turnsError.message)
    }

    const prep: PrepResult = {
      role_criteria: session.role_criteria ?? [],
      role_pain: session.role_pain ?? '',
      red_flags: session.red_flags ?? [],
    }

    const turns: ChatTurn[] = (existingTurns ?? []).map((t) => ({
      role: t.role as ChatTurn['role'],
      content: t.content,
    }))

    const evaluation = await runEvaluation(prep, turns)

    const { error: evalError } = await supabase.from('interview_evaluations').insert({
      session_id,
      verdict: evaluation.verdict,
      verdict_reason: evaluation.verdict_reason,
      criteria_scores: evaluation.criteria_scores,
      weak_spots: evaluation.weak_spots,
      skill_defense: evaluation.skill_defense,
    })

    if (evalError) {
      throw new Error(evalError.message)
    }

    await supabase.from('interview_sessions').update({ status: 'finished' }).eq('id', session_id)

    return NextResponse.json({ evaluation })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('interview finalize error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
