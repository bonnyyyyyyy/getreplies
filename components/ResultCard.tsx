'use client'

import { useState } from 'react'

type Tone = 'CONFIDENT' | 'CASUAL' | 'SHORTER'

const TONE_LABELS: { tone: Tone; label: string }[] = [
  { tone: 'CONFIDENT', label: 'More confident' },
  { tone: 'CASUAL', label: 'More casual' },
  { tone: 'SHORTER', label: 'Shorter' },
]

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function downloadDoc(text: string, filename: string) {
  const html = `<html><head><meta charset="utf-8"></head><body><pre style="font-family: Calibri, sans-serif; white-space: pre-wrap; font-size: 11pt;">${escapeHtml(text)}</pre></body></html>`
  const blob = new Blob(['﻿', html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadPdf(text: string, filename: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const lines = doc.splitTextToSize(text, 180)
  doc.setFontSize(11)
  doc.text(lines, 15, 20)
  doc.save(filename)
}

type Feedback = {
  strengths: string[]
  weaknesses: string[]
}

type ResultCardProps = {
  result: string
  onChangeResult: (text: string) => void
  onRegenerate: (tone?: Tone) => void
  busy: boolean
  showFindJobs: boolean
  onFindJobs: () => void
  findJobsLoading: boolean
  findJobsDisabled: boolean
  feedback?: Feedback
}

export function ResultCard({
  result,
  onChangeResult,
  onRegenerate,
  busy,
  showFindJobs,
  onFindJobs,
  findJobsLoading,
  findJobsDisabled,
  feedback,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(result)

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const startEditing = () => {
    setDraft(result)
    setEditing(true)
  }

  const saveEditing = () => {
    onChangeResult(draft)
    setEditing(false)
  }

  return (
    <div className="w-full max-w-2xl mt-10 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#333] tracking-widest">RESULT</p>
        <span className="text-[10px] text-[#4a4a4a] tracking-widest border border-[#1f1f1f] rounded-full px-3 py-1">
          WRITTEN TO SOUND HUMAN ✓
        </span>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full min-h-40 bg-black border border-[#1f1f1f] rounded-lg px-4 py-3 text-white text-sm leading-relaxed resize-none focus:outline-none focus:border-[#333]"
          autoFocus
        />
      ) : (
        <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">{result}</p>
      )}

      {editing ? (
        <div className="flex gap-2">
          <button
            onClick={saveEditing}
            className="px-4 py-2 bg-white text-black text-xs font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] transition-all"
          >
            SAVE
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-[#666] hover:text-white hover:border-[#333] transition-all"
          >
            CANCEL
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-[#888] hover:text-white hover:border-[#333] transition-all"
            >
              {copied ? 'COPIED ✓' : 'COPY'}
            </button>
            <button
              onClick={() => onRegenerate()}
              disabled={busy}
              className="px-4 py-2 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-[#888] hover:text-white hover:border-[#333] transition-all disabled:opacity-30"
            >
              REGENERATE
            </button>
            <button
              onClick={startEditing}
              className="px-4 py-2 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-[#888] hover:text-white hover:border-[#333] transition-all"
            >
              EDIT
            </button>
            <button
              onClick={() => downloadDoc(result, 'getreplies-result.doc')}
              className="px-4 py-2 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-[#888] hover:text-white hover:border-[#333] transition-all"
            >
              .DOC
            </button>
            <button
              onClick={() => downloadPdf(result, 'getreplies-result.pdf')}
              className="px-4 py-2 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-[#888] hover:text-white hover:border-[#333] transition-all"
            >
              .PDF
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {TONE_LABELS.map(({ tone, label }) => (
              <button
                key={tone}
                onClick={() => onRegenerate(tone)}
                disabled={busy}
                className="px-3 py-1.5 bg-transparent border border-[#1f1f1f] text-[10px] font-semibold tracking-widest rounded-full text-[#555] hover:text-white hover:border-[#333] transition-all disabled:opacity-30"
              >
                {label.toUpperCase()}
              </button>
            ))}
          </div>

          {feedback && (feedback.strengths.length > 0 || feedback.weaknesses.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4 mt-1 pt-4 border-t border-[#1f1f1f]">
              {feedback.strengths.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-[#555] tracking-widest">STRENGTHS</p>
                  <ul className="flex flex-col gap-1.5">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-[#ccc] leading-relaxed">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.weaknesses.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-[#555] tracking-widest">WEAK SPOTS</p>
                  <ul className="flex flex-col gap-1.5">
                    {feedback.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-[#ccc] leading-relaxed">• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {showFindJobs && (
            <button
              onClick={onFindJobs}
              disabled={findJobsDisabled}
              className="mt-1 px-8 py-3 bg-white text-black text-sm font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {findJobsLoading ? 'SEARCHING...' : 'SEARCH FOR YOUR JOB'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
