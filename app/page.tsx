'use client'

import { useState } from 'react'

type Mode = 'OUTREACH' | 'LETTER'

export default function Home() {
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<Mode>('OUTREACH')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePolish = async () => {
    if (!message.trim()) return
    setLoading(true)
    setResult('')

    const res = await fetch('/api/polish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, mode })
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('API error:', text)
      setResult('Sorry. Something went wrong. We`re working on it')
      setLoading(false)
      return
    }

    const data = await res.json()
    setResult(data.result)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">

      <h1 className="text-4xl font-bold tracking-tight mb-12">GetReplies</h1>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your raw message here..."
        className="w-full max-w-2xl h-40 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4 text-white placeholder-[#333] resize-none focus:outline-none focus:border-[#333] text-sm leading-relaxed"
      />

      <div className="flex gap-3 mt-6">
        {(['OUTREACH', 'LETTER'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-widest transition-all ${
              mode === m
                ? 'bg-white text-black'
                : 'bg-transparent text-[#444] border border-[#1f1f1f] hover:border-[#333] hover:text-[#666]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <button
        onClick={handlePolish}
        disabled={loading || !message.trim()}
        className="mt-8 px-10 py-3 bg-white text-black text-sm font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {loading ? 'POLISHING...' : 'POLISH'}
      </button>

      {result && (
        <div className="w-full max-w-2xl mt-10 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#333] tracking-widest">RESULT</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result)
              }}
              className="text-xs text-[#444] hover:text-white tracking-widest transition-all"
            >
              COPY
            </button>
          </div>
          <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}

    </main>
  )
}