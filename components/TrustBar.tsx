'use client'

import { useEffect, useState } from 'react'

const BUBBLES = [
  "No template feel, no robot voice — just your words, sharper.",
  "Cover letters that don't read like every other cover letter.",
  "Type once. Get a version that actually sounds like you.",
]

export function TrustBar() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setIndex((i) => (i + 1) % BUBBLES.length), 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-2xl mt-14 flex flex-col items-center gap-4">
      <div
        key={index}
        className="max-w-sm bg-[#111] border border-[#1f1f1f] rounded-2xl rounded-bl-sm px-4 py-3 text-xs text-[#aaa] leading-relaxed"
      >
        {BUBBLES[index]}
      </div>

      <p className="text-[10px] text-[#3a3a3a] tracking-wide text-center">
        Vacancies via Adzuna · Processing via OpenAI · No auto-apply — the final click is always yours
      </p>
    </div>
  )
}
