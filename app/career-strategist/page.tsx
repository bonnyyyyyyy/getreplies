'use client'

import { useState } from 'react'

type MessageType = 'COVER_LETTER' | 'RECRUITER_OUTREACH' | 'LINKEDIN_NOTE' | 'FOLLOW_UP'
type Audience = 'RECRUITER' | 'HIRING_MANAGER' | 'NETWORKING_CONTACT' | 'REFERRAL'
type Style = 'CONFIDENT' | 'CASUAL' | 'FORMAL' | 'WARM'

const MESSAGE_TYPES: { value: MessageType; label: string }[] = [
  { value: 'COVER_LETTER', label: 'Cover Letter' },
  { value: 'RECRUITER_OUTREACH', label: 'Recruiter Outreach' },
  { value: 'LINKEDIN_NOTE', label: 'LinkedIn Connection Note' },
  { value: 'FOLLOW_UP', label: 'Follow-Up' },
]

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'RECRUITER', label: 'Recruiter' },
  { value: 'HIRING_MANAGER', label: 'Hiring Manager' },
  { value: 'NETWORKING_CONTACT', label: 'Networking Contact' },
  { value: 'REFERRAL', label: 'Referral' },
]

const STYLES: { value: Style; label: string }[] = [
  { value: 'CONFIDENT', label: 'Confident' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'WARM', label: 'Warm' },
]

const MAX_WORDS = 300

// Static — the usage-limit backend (lib/usage.ts + Paywall) already exists
// elsewhere in the app but isn't wired up here yet. This is UI only.
const FREE_ATTEMPTS_LABEL = '3/3 free attempts left'

function selectClass(active: boolean) {
  return `bg-[#0a0a0a] border rounded-full px-4 py-2 text-xs tracking-widest focus:outline-none transition-all ${
    active ? 'border-[#333] text-white' : 'border-[#1f1f1f] text-[#888]'
  }`
}

export default function CareerStrategistPage() {
  const [messageType, setMessageType] = useState<MessageType>('COVER_LETTER')
  const [audience, setAudience] = useState<Audience>('RECRUITER')
  const [style, setStyle] = useState<Style>('CONFIDENT')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0

  const handleGet = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/career-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, messageType, audience, style }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.')
        return
      }

      setResult(data.result)
    } catch (err) {
      console.error('career-message error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-10">
      <div className="flex flex-col items-center text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">AI career strategist</h1>
        <p className="mt-4 text-base text-[#ddd]">Build your communication with AI</p>
      </div>

      <div className="w-full max-w-4xl flex flex-wrap items-center justify-center gap-6 mb-8">
        <select
          value={messageType}
          onChange={(e) => setMessageType(e.target.value as MessageType)}
          className={selectClass(true)}
        >
          {MESSAGE_TYPES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value as Audience)}
          className={selectClass(true)}
        >
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>

        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as Style)}
          className={selectClass(true)}
        >
          {STYLES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="write it how you feel..."
            className="w-full h-72 bg-black border border-[#1f1f1f] rounded-xl px-5 py-4 text-white placeholder-[#333] resize-none focus:outline-none focus:border-[#333] text-sm leading-relaxed"
          />
          <p className="text-xs text-[#444] tracking-wide self-end">{wordCount}/{MAX_WORDS} words</p>
        </div>

        <div className="w-full h-72 bg-black border border-[#1f1f1f] rounded-xl px-5 py-4 overflow-y-auto">
          <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      </div>

      {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

      <div className="w-full max-w-4xl flex items-center justify-between mt-4">
        <div className="flex gap-3">
          <button
            onClick={handleGet}
            disabled={loading || !input.trim()}
            className="px-6 py-2.5 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-white hover:border-[#333] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'WRITING...' : 'Get'}
          </button>
          <button
            onClick={handleCopy}
            disabled={!result}
            className="px-6 py-2.5 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-white hover:border-[#333] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </div>

        <p className="text-xs text-[#555] italic">{FREE_ATTEMPTS_LABEL}</p>
      </div>
    </main>
  )
}
