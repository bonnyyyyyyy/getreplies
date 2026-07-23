import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SavedJob = {
  title: string
  company: string
  url: string
  reason: string
}

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { data: rows, error } = await supabase
    .from('saved_jobs')
    .select('title, company, url, reason')
    .eq('user_id', claims.sub)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ jobs: rows ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const body: Partial<SavedJob> = await req.json()

  if (!body.url || !body.title || !body.company) {
    return NextResponse.json({ error: 'Missing job fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('saved_jobs')
    .upsert(
      {
        user_id: claims.sub,
        title: body.title,
        company: body.company,
        url: body.url,
        reason: body.reason ?? '',
      },
      { onConflict: 'user_id,url' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const { error } = await supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', claims.sub)
    .eq('url', url)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
