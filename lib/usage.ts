import type { SupabaseClient } from '@supabase/supabase-js'

export const FREE_RESET_DAYS = 30
export const FREE_RESUME_LIMIT = 1
export const FREE_JOB_LIMIT = 5
export const SUBSCRIBED_JOB_LIMIT = 20

type UsageRow = {
  resume_uses_free: number
  is_subscribed: boolean
  last_reset_date: string
}

export type UsageResult = { allowed: true; jobLimit: number } | { allowed: false; paywall: true }

export type UsageStatus = {
  resumeUsesFree: number
  isSubscribed: boolean
  freeLimit: number
  jobLimit: number
  remaining: number | null
}

async function getUsageRow(supabase: SupabaseClient, userId: string): Promise<UsageRow> {
  const { data: existing } = await supabase
    .from('usage')
    .select('resume_uses_free, is_subscribed, last_reset_date')
    .eq('user_id', userId)
    .maybeSingle<UsageRow>()

  if (existing) return existing

  const { data: inserted, error } = await supabase
    .from('usage')
    .insert({ user_id: userId })
    .select('resume_uses_free, is_subscribed, last_reset_date')
    .single<UsageRow>()

  if (error || !inserted) {
    throw new Error(`Could not create usage record: ${error?.message}`)
  }
  return inserted
}

function resetIfStale(row: UsageRow): UsageRow {
  const daysSinceReset = (Date.now() - new Date(row.last_reset_date).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceReset >= FREE_RESET_DAYS) {
    return { ...row, resume_uses_free: 0 }
  }
  return row
}

// Read-only snapshot of a user's usage, safe to call from a GET endpoint.
export async function getUsageStatus(supabase: SupabaseClient, userId: string): Promise<UsageStatus> {
  const row = resetIfStale(await getUsageRow(supabase, userId))
  const jobLimit = row.is_subscribed ? SUBSCRIBED_JOB_LIMIT : FREE_JOB_LIMIT

  return {
    resumeUsesFree: row.resume_uses_free,
    isSubscribed: row.is_subscribed,
    freeLimit: FREE_RESUME_LIMIT,
    jobLimit,
    remaining: row.is_subscribed ? null : Math.max(0, FREE_RESUME_LIMIT - row.resume_uses_free),
  }
}

// Consumes one free resume generation. Call this once per resume/letter actually generated.
export async function checkAndConsumeUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageResult> {
  const original = await getUsageRow(supabase, userId)
  const row = resetIfStale(original)

  if (row.resume_uses_free !== original.resume_uses_free) {
    await supabase
      .from('usage')
      .update({ resume_uses_free: 0, last_reset_date: new Date().toISOString() })
      .eq('user_id', userId)
  }

  if (!row.is_subscribed && row.resume_uses_free >= FREE_RESUME_LIMIT) {
    return { allowed: false, paywall: true }
  }

  await supabase
    .from('usage')
    .update({ resume_uses_free: row.resume_uses_free + 1 })
    .eq('user_id', userId)

  return { allowed: true, jobLimit: row.is_subscribed ? SUBSCRIBED_JOB_LIMIT : FREE_JOB_LIMIT }
}
