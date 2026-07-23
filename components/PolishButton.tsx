'use client'

import { useEffect, useState } from 'react'

const LOADING_STEPS = ['Reading tone...', 'Sharpening...', 'Almost there...']
const STEP_MS = 900

export function PolishButton({
  onClick,
  disabled,
  loading,
}: {
  onClick: () => void
  disabled: boolean
  loading: boolean
}) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!loading) return

    Promise.resolve().then(() => setStep(0))
    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1))
    }, STEP_MS)
    return () => clearInterval(interval)
  }, [loading])

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`mt-8 px-10 py-3 text-sm font-semibold tracking-widest rounded-full transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] disabled:hover:scale-100 disabled:active:scale-100 ${
        disabled && !loading
          ? 'bg-[#1a1a1a] text-[#444] cursor-not-allowed'
          : 'bg-white text-black hover:bg-[#e5e5e5] hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] disabled:opacity-60 disabled:cursor-wait'
      }`}
    >
      {loading ? LOADING_STEPS[step] : 'POLISH'}
    </button>
  )
}
