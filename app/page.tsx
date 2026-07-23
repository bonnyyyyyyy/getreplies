'use client'

import { useState } from 'react'
import { useAuth, SignInForm } from '@/components/AuthGate'
import { JobMatchCard } from '@/components/JobMatchCard'
import { Paywall } from '@/components/Paywall'
import { COUNTRIES, WORK_FORMATS, type WorkFormat } from '@/lib/jobFilters'

type Mode = 'CV' | 'LETTER'

type RankedJob = {
  title: string
  company: string
  url: string
  reason: string
}

export default function Home() {
  const { user, loading: authLoading } = useAuth()

  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<Mode>('CV')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobs, setJobs] = useState<RankedJob[] | null>(null)
  const [paywall, setPaywall] = useState(false)
  const [jobsError, setJobsError] = useState('')
  const [country, setCountry] = useState('ANY')
  const [workFormat, setWorkFormat] = useState<WorkFormat>('ANY')

  const resetJobResults = () => {
    setJobs(null)
    setPaywall(false)
    setJobsError('')
  }

  const handlePolish = async () => {
    if (!message.trim()) return
    setLoading(true)
    setResult('')
    resetJobResults()

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

  const handleFindJobs = async () => {
    if (!result.trim() || !user) return
    setJobsLoading(true)
    resetJobResults()

    try {
      const res = await fetch('/api/match-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: result, country, workFormat })
      })

      const data = await res.json()

      if (!res.ok) {
        setJobsError(data.error || 'Something went wrong. Try again.')
      } else if (data.paywall) {
        setPaywall(true)
      } else {
        setJobs(data.jobs)
      }
    } catch (err) {
      console.error('match-jobs error:', err)
      setJobsError('Something went wrong. Try again.')
    } finally {
      setJobsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">

      <h1 className="text-4xl font-bold tracking-tight mb-12">GetReplies</h1>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your raw message here..."
        className="w-full max-w-2xl h-40 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4 text-white placeholder-[#333] resize-none focus:outline-none focus:border-[#333] text-sm leading-relaxed"
      />

      <div className="flex gap-3 mt-6">
        {(['CV', 'LETTER'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m)
              resetJobResults()
            }}
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

      {result && mode === 'CV' && (
        <div className="w-full max-w-2xl mt-6 flex flex-col items-center gap-6">
          {jobs === null && !paywall && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-full px-4 py-2 text-white text-xs tracking-widest focus:outline-none focus:border-[#333]"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>

              <div className="flex gap-2">
                {WORK_FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setWorkFormat(f)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-widest transition-all ${
                      workFormat === f
                        ? 'bg-white text-black'
                        : 'bg-transparent text-[#444] border border-[#1f1f1f] hover:border-[#333] hover:text-[#666]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {authLoading && <p className="text-xs text-[#666] tracking-widest">LOADING...</p>}

          {!authLoading && !user && jobs === null && !paywall && <SignInForm />}

          {!authLoading && user && jobs === null && !paywall && (
            <button
              onClick={handleFindJobs}
              disabled={jobsLoading}
              className="px-10 py-3 bg-transparent border border-[#1f1f1f] text-sm font-semibold tracking-widest rounded-full text-white hover:border-[#333] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              {jobsLoading ? 'SEARCHING...' : 'FIND VACANCIES'}
            </button>
          )}

          {jobsError && <p className="text-xs text-red-400">{jobsError}</p>}

          {paywall && <Paywall />}

          {jobs && (
            <div className="w-full flex flex-col gap-4">
              {jobs.map((job, i) => (
                <JobMatchCard key={`${job.url}-${i}`} title={job.title} company={job.company} reason={job.reason} url={job.url} />
              ))}
            </div>
          )}
        </div>
      )}

    </main>
  )
}
