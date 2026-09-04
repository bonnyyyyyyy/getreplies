'use client'

import { usePathname } from 'next/navigation'

// The soft top-right glow from the reference design — home page only, and
// rendered at the layout level (not inside <main>) so it starts from the
// very top of the page, behind the header too.
export function HomeGradient() {
  const pathname = usePathname()
  if (pathname !== '/') return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse 800px 600px at 100% 0%, rgba(255,255,255,0.16), transparent 65%)',
      }}
    />
  )
}
