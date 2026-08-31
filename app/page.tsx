'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { JobMatchCard } from '@/components/JobMatchCard'
import { ModeSubtitle } from '@/components/ModeSubtitle'
import { ExampleChip } from '@/components/ExampleChip'
import { LiveCharCounter } from '@/components/LiveCharCounter'
import { PolishButton } from '@/components/PolishButton'
import { ResultCard } from '@/components/ResultCard'
import { TrustBar } from '@/components/TrustBar'
import { COUNTRIES, WORK_FORMATS, type WorkFormat } from '@/lib/jobFilters'

type Mode = 'CV' | 'LETTER'
type Tone = 'CONFIDENT' | 'CASUAL' | 'SHORTER'

type RankedJob = {
  title: string
  company: string
  url: string
  reason: string
  matchPercent?: number
}

export default function Home() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<Mode>('CV')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [polishError, setPolishError] = useState('')

  const [showJobFilters, setShowJobFilters] = useState(false)
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobs, setJobs] = useState<RankedJob[] | null>(null)
  const [jobsError, setJobsError] = useState('')
  const [country, setCountry] = useState('ANY')
  const [workFormat, setWorkFormat] = useState<WorkFormat>('ANY')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 480)}px`
  }, [message])

  const resetJobResults = () => {
    setShowJobFilters(false)
    setJobs(null)
    setJobsError('')
  }

  const resetPolishState = () => {
    setResult('')
    setPolishError('')
    resetJobResults()
  }

  const runPolish = async (tone?: Tone) => {
    if (!message.trim()) return

    const isRegenerate = Boolean(result)
    if (isRegenerate) {
      setRegenerating(true)
    } else {
      setLoading(true)
    }
    setPolishError('')

    try {
      const res = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mode, tone })
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('API error:', data)
        setPolishError('Sorry. Something went wrong. We`re working on it')
        return
      }

      setResult(data.result)
      resetJobResults()
    } finally {
      setLoading(false)
      setRegenerating(false)
    }
  }

  const handleFindJobs = async () => {
    if (!result.trim()) return
    setJobsLoading(true)
    setJobsError('')
    setJobs(null)

    try {
      const res = await fetch('/api/match-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: result, country, workFormat })
      })

      const data = await res.json()

      if (!res.ok) {
        setJobsError(data.error || 'Something went wrong. Try again.')
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

  // Hands the CV and the vacancy over to the mock interview agent.
  const handleMockInterview = (job: RankedJob) => {
    try {
      sessionStorage.setItem('gr_resume_text', result)
      sessionStorage.setItem(
        'gr_job_description',
        `${job.title} at ${job.company}\n\n${job.reason}`
      )
    } catch {
      // Storage blocked — /interview still works, the fields just start empty.
    }
    router.push('/interview')
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-16">

      <div className="flex flex-col items-center text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">GetReplies</h1>
        <p className="mt-4 text-base text-[#ddd]">Write naturally. Let AI optimize the delivery.</p>
        <p className="mt-1.5 text-xs text-[#666] max-w-sm">Your voice stays yours. We just sharpen how it lands.</p>
      </div>

      <div className="flex items-center gap-3">
        {(['CV', 'LETTER'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m)
              resetPolishState()
            }}
            className={`px-6 py-2.5 rounded-full text-xs font-semibold tracking-widest transition-all hover:scale-[1.03] active:scale-[0.97] ${
              mode === m
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.12)]'
                : 'bg-transparent text-[#444] border border-[#1f1f1f] hover:border-[#333] hover:text-[#666]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <ModeSubtitle mode={mode} />

      <div className="relative w-full max-w-2xl mt-4">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say it how you'd actually say it — we'll clean it up."
          rows={5}
          className="w-full min-h-40 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4 pr-32 text-white placeholder-[#333] resize-none focus:outline-none focus:border-[#333] text-sm leading-relaxed overflow-hidden"
        />
        <ExampleChip onInsert={setMessage} />
        <LiveCharCounter length={message.length} />
      </div>

      <PolishButton onClick={() => runPolish()} disabled={!message.trim()} loading={loading} />

      {polishError && <p className="mt-4 text-xs text-red-400">{polishError}</p>}

      {result && (
        <ResultCard
          result={result}
          onChangeResult={setResult}
          onRegenerate={runPolish}
          busy={loading || regenerating}
          showFindJobs={mode === 'CV'}
          onFindJobs={() => setShowJobFilters(true)}
          findJobsLoading={false}
          findJobsDisabled={showJobFilters}
        />
      )}

      {result && mode === 'CV' && showJobFilters && (
        <div className="w-full max-w-2xl mt-6 flex flex-col items-center gap-6">
          {jobs === null && (
            <div className="flex flex-col items-center gap-4">
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

              <button
                onClick={handleFindJobs}
                disabled={jobsLoading}
                className="px-10 py-3 bg-white text-black text-sm font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {jobsLoading ? 'SEARCHING...' : 'SEARCH VACANCIES'}
              </button>
            </div>
          )}

          {jobsError && <p className="text-xs text-red-400">{jobsError}</p>}

          {jobs && (
            <div className="w-full flex flex-col gap-4">
              {jobs.map((job, i) => (
                <JobMatchCard
                  key={`${job.url}-${i}`}
                  title={job.title}
                  company={job.company}
                  reason={job.reason}
                  url={job.url}
                  matchPercent={job.matchPercent}
                  onMockInterview={() => handleMockInterview(job)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <TrustBar />

    </main>
  )
}
