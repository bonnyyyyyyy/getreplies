'use client'

import { useState } from 'react'
import { VoiceInputButton } from '@/components/VoiceInputButton'
import { ResumeUpload } from '@/components/ResumeUpload'

type InputMethod = 'WRITE' | 'TELL' | 'UPLOAD'

const METHODS: { key: InputMethod; label: string }[] = [
  { key: 'WRITE', label: 'Write' },
  { key: 'TELL', label: 'Tell' },
  { key: 'UPLOAD', label: 'Upload' },
]

type InputMethodTabsProps = {
  onAppendText: (text: string) => void
  disabled?: boolean
}

// Three ways to fill the same textarea below this: type it, dictate it, or
// upload a PDF/DOCX. Whichever method is active just decides what control
// renders here — the destination text field is shared and stays editable.
export function InputMethodTabs({ onAppendText, disabled }: InputMethodTabsProps) {
  const [method, setMethod] = useState<InputMethod>('WRITE')

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMethod(m.key)}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-widest transition-all ${
              method === m.key
                ? 'bg-white text-black'
                : 'bg-transparent text-[#444] border border-[#1f1f1f] hover:border-[#333] hover:text-[#666]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {method === 'TELL' && <VoiceInputButton onTranscript={onAppendText} disabled={disabled} />}
      {method === 'UPLOAD' && <ResumeUpload onExtracted={onAppendText} disabled={disabled} />}
    </div>
  )
}
