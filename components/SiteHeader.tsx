'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Persistent top bar shown on every page — matches the design mockups where
// the "GR." mark and "Get More Replies" CTA appear on every screen. The CTA
// itself is hidden on /pricing, since linking to itself there is circular
// (matches the reference design, which shows only the logo on that page).
export function SiteHeader() {
  const pathname = usePathname()
  const onPricingPage = pathname?.startsWith('/pricing')

  return (
    <header className="relative w-full flex items-center justify-between px-6 py-6">
      <Link href="/" className="text-xl font-bold tracking-tight text-white">
        GR.
      </Link>
      {!onPricingPage && (
        <Link
          href="/pricing"
          className="px-5 py-2.5 bg-[#0a0a0a] border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-white hover:border-[#333] transition-all"
        >
          Get More Replies
        </Link>
      )}
    </header>
  )
}
