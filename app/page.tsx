'use client'

import Link from 'next/link'
import { TrustBar } from '@/components/TrustBar'

export default function Home() {
  return (
    <main className="relative min-h-screen text-white flex flex-col items-center px-6 py-16">
      <div className="flex flex-col items-center text-center mb-14">
        <h1 className="text-5xl font-bold tracking-tight">GetReplies</h1>
        <p className="mt-4 text-base text-[#ddd]">AI job hunter &amp; career strategist</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/job-hunter"
          className="px-8 py-4 bg-white text-black text-sm font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          AI job hunter ✨
        </Link>
        <Link
          href="/career-strategist"
          className="px-8 py-4 bg-white text-black text-sm font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Career Strategist
        </Link>
      </div>

      <TrustBar />
    </main>
  )
}
