'use client'

import { useState } from 'react'

type JobMatchCardProps = {
  title: string
  company: string
  reason: string
  url: string
  matchPercent?: number
  saved?: boolean
  onToggleSave?: () => void
}

function guessDomain(company: string): string {
  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return `${slug}.com`
}

export function JobMatchCard({ title, company, reason, url, matchPercent, saved, onToggleSave }: JobMatchCardProps) {
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <div className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {!logoFailed && company && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://logo.clearbit.com/${guessDomain(company)}`}
              alt=""
              width={28}
              height={28}
              className="rounded-md bg-white/5 shrink-0"
              onError={() => setLogoFailed(true)}
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white truncate">{title}</p>
              {typeof matchPercent === 'number' && (
                <span className="shrink-0 text-[10px] font-semibold tracking-wide text-black bg-white rounded-full px-2 py-0.5">
                  {matchPercent}% MATCH
                </span>
              )}
            </div>
            <p className="text-xs text-[#666] truncate">{company}</p>
          </div>
        </div>

        {onToggleSave && (
          <button
            onClick={onToggleSave}
            aria-label={saved ? 'Remove from saved' : 'Save vacancy'}
            className={`shrink-0 text-lg leading-none transition-colors ${saved ? 'text-white' : 'text-[#444] hover:text-[#888]'}`}
          >
            {saved ? '★' : '☆'}
          </button>
        )}
      </div>

      <div>
        <p className="text-[10px] text-[#555] tracking-widest mb-1">WHY THIS FITS</p>
        <p className="text-sm text-[#ccc] leading-relaxed">{reason}</p>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="self-start mt-1 px-5 py-2 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-white hover:border-[#333] transition-all"
      >
        VIEW VACANCY
      </a>
    </div>
  )
}
