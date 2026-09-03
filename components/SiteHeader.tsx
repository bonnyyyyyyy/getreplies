import Link from 'next/link'

// Persistent top bar shown on every page — matches the design mockups where
// the "GR." mark and "Get More Replies" CTA appear on every screen.
export function SiteHeader() {
  const checkoutUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_URL || '#'

  return (
    <header className="w-full flex items-center justify-between px-6 py-6">
      <Link href="/" className="text-xl font-bold tracking-tight text-white">
        GR.
      </Link>
      <a
        href={checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-2.5 bg-[#0a0a0a] border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-white hover:border-[#333] transition-all"
      >
        Get More Replies
      </a>
    </header>
  )
}
