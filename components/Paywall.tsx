export function Paywall({ onDismiss }: { onDismiss?: () => void }) {
  const checkoutUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_URL || '#'

  return (
    <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-6 py-6 flex flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs text-[#999] tracking-widest">OUT OF FREE USES</p>
        <p className="text-sm text-white">$1 unlocks 10 more runs</p>
        <p className="text-xs text-[#555]">All modes stay free — you only pay if you need more runs</p>
      </div>

      <div className="flex items-center gap-3">
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-2.5 bg-white text-black text-xs font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] transition-all"
        >
          GET 10 MORE — $1
        </a>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-[#555] hover:text-[#888] tracking-widest transition-all"
          >
            NOT NOW
          </button>
        )}
      </div>
    </div>
  )
}
