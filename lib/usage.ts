import type { SupabaseClient } from '@supabase/supabase-js'

const FREE_RESET_DAYS = 30
const FREE_RESUME_LIMIT = 1
const FREE_JOB_LIMIT = 5
const SUBSCRIBED_JOB_LIMIT = 20

type UsageRow = {
  resume_uses_free: number
  is_subscribed: boolean
  last_reset_date: string
}

export type UsageResult = { allowed: true; jobLimit: number } | { allowed: false; paywall: true }

export async function checkAndConsumeUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageResult> {
  const { data: existing } = await supabase
    .from('usage')
    .select('resume_uses_free, is_subscribed, last_reset_date')
    .eq('user_id', userId)
    .maybeSingle<UsageRow>()

  let row = existing

  if (!row) {
    const { data: inserted, error } = await supabase
      .from('usage')
      .insert({ user_id: userId })
      .select('resume_uses_free, is_subscribed, last_reset_date')
      .single<UsageRow>()

    if (error || !inserted) {
      throw new Error(`Could not create usage record: ${error?.message}`)
    }
    row = inserted
  }

  let { resume_uses_free: resumeUsesFree } = row
  const { is_subscribed: isSubscribed, last_reset_date: lastResetDate } = row

  const daysSinceReset = (Date.now() - new Date(lastResetDate).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceReset >= FREE_RESET_DAYS) {
    resumeUsesFree = 0
    await supabase
      .from('usage')
      .update({ resume_uses_free: 0, last_reset_date: new Date().toISOString() })
      .eq('user_id', userId)
  }

  if (!isSubscribed && resumeUsesFree >= FREE_RESUME_LIMIT) {
    return { allowed: false, paywall: true }
  }

  await supabase
    .from('usage')
    .update({ resume_uses_free: resumeUsesFree + 1 })
    .eq('user_id', userId)

  return { allowed: true, jobLimit: isSubscribed ? SUBSCRIBED_JOB_LIMIT : FREE_JOB_LIMIT }
}
