export type UsageState = {
  signedIn: boolean
  isSubscribed?: boolean
  remaining?: number | null
  freeLimit: number
}

export function UsageIndicator({ usage }: { usage: UsageState | null }) {
  if (!usage) return null

  if (!usage.signedIn) {
    return (
      <p className="text-[11px] text-[#555] tracking-wide">
        All modes free — sign in when you polish to track your usage
      </p>
    )
  }

  if (usage.isSubscribed) {
    return <p className="text-[11px] text-[#555] tracking-wide">Subscribed — unlimited runs</p>
  }

  const remaining = usage.remaining ?? 0

  if (remaining <= 0) {
    return (
      <p className="text-[11px] text-[#999] tracking-wide">
        Out of free uses — <span className="text-white">$1 unlocks 10 more</span>
      </p>
    )
  }

  return (
    <p className="text-[11px] text-[#555] tracking-wide">
      {remaining} free {remaining === 1 ? 'use' : 'uses'} left · pay only if you need more runs
    </p>
  )
}
