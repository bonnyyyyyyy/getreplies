'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth, SignInForm } from '@/components/AuthGate'

type Message = { role: 'interviewer' | 'candidate'; content: string }

type CriterionScore = {
  criterion: string
  status: 'pass' | 'borderline' | 'fail'
  comment: string
}

type Evaluation = {
  verdict: 'advance' | 'borderline' | 'pass'
  verdict_reason: string
  criteria_scores: CriterionScore[]
  weak_spots: string[]
  skill_defense: string[]
}

type Phase = 'start' | 'chat' | 'result'

const VERDICT_LABEL: Record<Evaluation['verdict'], string> = {
  advance: 'ADVANCE',
  borderline: 'BORDERLINE',
  pass: 'PASS',
}

function readStored(key: string): string {
  if (typeof window === 'undefined') return ''
  try {
    return sessionStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

export default function InterviewPage() {
  const { user, loading: authLoading } = useAuth()

  const [phase, setPhase] = useState<Phase>('start')
  const [jobDescription, setJobDescription] = useState(() => readStored('gr_job_description'))
  const [resumeText, setResumeText] = useState(() => readStored('gr_resume_text'))
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [answer, setAnswer] = useState('')
  const [readyToFinish, setReadyToFinish] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)

  const [starting, setStarting] = useState(false)
  const [sending, setSending] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) return
    setError('')
    setStarting(true)

    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jobDescription, resume_text: resumeText }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.')
        return
      }

      setSessionId(data.session_id)
      setMessages([{ role: 'interviewer', content: data.first_question }])
      setPhase('chat')
    } catch (err) {
      console.error('interview start error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setStarting(false)
    }
  }

  const handleSend = async () => {
    if (!answer.trim() || !sessionId) return
    setError('')
    setSending(true)

    const candidateTurn: Message = { role: 'candidate', content: answer }
    setMessages((prev) => [...prev, candidateTurn])
    setAnswer('')

    try {
      const res = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, answer: candidateTurn.content }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.')
        return
      }

      setMessages((prev) => [...prev, { role: 'interviewer', content: data.message }])
      setReadyToFinish(data.type === 'ready_to_finish')
    } catch (err) {
      console.error('interview answer error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setSending(false)
    }
  }

  const handleFinish = async () => {
    if (!sessionId) return
    setError('')
    setFinishing(true)

    try {
      const res = await fetch('/api/interview/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.')
        return
      }

      setEvaluation(data.evaluation)
      setPhase('result')
    } catch (err) {
      console.error('interview finalize error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setFinishing(false)
    }
  }

  const handleRestart = () => {
    setPhase('start')
    setSessionId(null)
    setMessages([])
    setAnswer('')
    setReadyToFinish(false)
    setEvaluation(null)
    setError('')
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl flex items-center justify-between mb-10">
        <Link href="/" className="text-xs text-[#555] hover:text-white tracking-widest transition-all">
          ← BACK
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">MOCK INTERVIEW</h1>
        <span className="w-12" />
      </div>

      {authLoading && <p className="text-xs text-[#666] tracking-widest">LOADING...</p>}

      {!authLoading && !user && <SignInForm label="SIGN IN TO RUN A MOCK INTERVIEW" />}

      {!authLoading && user && phase === 'start' && (
        <div className="w-full max-w-2xl flex flex-col items-center gap-4">
          <p className="text-xs text-[#666] tracking-widest self-start">THE VACANCY</p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description..."
            className="w-full h-40 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4 text-white placeholder-[#333] resize-none focus:outline-none focus:border-[#333] text-sm leading-relaxed"
          />

          <p className="text-xs text-[#666] tracking-widest self-start">YOUR CV</p>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your CV, or generate one on the home page first..."
            className="w-full h-40 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4 text-white placeholder-[#333] resize-none focus:outline-none focus:border-[#333] text-sm leading-relaxed"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={handleStart}
            disabled={starting || !jobDescription.trim() || !resumeText.trim()}
            className="mt-2 px-10 py-3 bg-white text-black text-sm font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {starting ? 'PREPARING...' : 'START INTERVIEW'}
          </button>
        </div>
      )}

      {!authLoading && user && phase === 'chat' && (
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'interviewer'
                    ? 'self-start bg-[#0a0a0a] border border-[#1f1f1f] text-[#ccc]'
                    : 'self-end bg-white text-black'
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="self-start bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-4 py-3 text-sm text-[#666]">
                ...
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex flex-col gap-3">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full h-24 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4 text-white placeholder-[#333] resize-none focus:outline-none focus:border-[#333] text-sm leading-relaxed"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSend}
                disabled={sending || finishing || !answer.trim()}
                className="px-8 py-2.5 bg-white text-black text-xs font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                {sending ? 'SENDING...' : 'SEND'}
              </button>
              <button
                onClick={handleFinish}
                disabled={finishing || sending || messages.length < 2}
                className={`px-8 py-2.5 text-xs font-semibold tracking-widest rounded-full transition-all disabled:opacity-20 disabled:cursor-not-allowed ${
                  readyToFinish
                    ? 'bg-white text-black hover:bg-[#e5e5e5]'
                    : 'bg-transparent border border-[#1f1f1f] text-white hover:border-[#333]'
                }`}
              >
                {finishing ? 'FINISHING...' : 'FINISH INTERVIEW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!authLoading && user && phase === 'result' && evaluation && (
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-6 py-6 flex flex-col gap-3">
            <p className="text-xs text-[#666] tracking-widest">VERDICT</p>
            <p className="text-2xl font-bold tracking-tight">{VERDICT_LABEL[evaluation.verdict]}</p>
            <p className="text-sm text-[#ccc] leading-relaxed">{evaluation.verdict_reason}</p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-6 py-6 flex flex-col gap-4">
            <p className="text-xs text-[#666] tracking-widest">CRITERIA</p>
            {evaluation.criteria_scores.map((c, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-white">
                  {c.criterion} — <span className="text-[#999]">{c.status.toUpperCase()}</span>
                </p>
                <p className="text-sm text-[#ccc] leading-relaxed">{c.comment}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-6 py-6 flex flex-col gap-3">
            <p className="text-xs text-[#666] tracking-widest">WEAK SPOTS</p>
            <ul className="flex flex-col gap-2">
              {evaluation.weak_spots.map((w, i) => (
                <li key={i} className="text-sm text-[#ccc] leading-relaxed">• {w}</li>
              ))}
            </ul>
          </div>

          {evaluation.skill_defense.length > 0 && (
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-6 py-6 flex flex-col gap-3">
              <p className="text-xs text-[#666] tracking-widest">SKILLS YOU DID NOT DEFEND</p>
              <ul className="flex flex-col gap-2">
                {evaluation.skill_defense.map((s, i) => (
                  <li key={i} className="text-sm text-[#ccc] leading-relaxed">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleRestart}
            className="self-center mt-2 px-10 py-3 bg-transparent border border-[#1f1f1f] text-sm font-semibold tracking-widest rounded-full text-white hover:border-[#333] transition-all"
          >
            RUN ANOTHER INTERVIEW
          </button>
        </div>
      )}
    </main>
  )
}
