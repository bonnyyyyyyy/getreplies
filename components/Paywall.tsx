export function Paywall() {
  const checkoutUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_URL || '#'

  return (
    <div className="w-full max-w-2xl bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-6 py-6 flex flex-col items-center gap-6">
      <p className="text-xs text-[#666] tracking-widest">YOU HAVE USED YOUR FREE RESUME MATCH</p>

      <div className="w-full grid grid-cols-2 gap-4">
        <div className="border border-[#1f1f1f] rounded-xl px-4 py-4 flex flex-col gap-2">
          <p className="text-xs text-[#444] tracking-widest">FREE</p>
          <p className="text-sm text-[#ccc]">1 resume / month</p>
          <p className="text-sm text-[#ccc]">Top 5 vacancies</p>
        </div>
        <div className="border border-white rounded-xl px-4 py-4 flex flex-col gap-2">
          <p className="text-xs text-white tracking-widest">SUBSCRIPTION</p>
          <p className="text-sm text-white">Unlimited resumes</p>
          <p className="text-sm text-white">Top 20 vacancies</p>
        </div>
      </div>

      <a
        href={checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-10 py-3 bg-white text-black text-sm font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] transition-all"
      >
        UPGRADE
      </a>
    </div>
  )
}
