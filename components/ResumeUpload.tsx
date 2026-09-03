'use client'

import { useRef, useState } from 'react'

type ResumeUploadProps = {
  onExtracted: (text: string) => void
  disabled?: boolean
}

export function ResumeUpload({ onExtracted, disabled }: ResumeUploadProps) {
  const [status, setStatus] = useState<'idle' | 'uploading'>('idle')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError('')
    setFileName(file.name)
    setStatus('uploading')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/parse-resume', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Could not read that file')
        return
      }

      onExtracted(data.text)
    } catch (err) {
      console.error('parse-resume request error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || status === 'uploading'}
        className="self-start px-5 py-2 bg-transparent border border-[#1f1f1f] text-xs font-semibold tracking-widest rounded-full text-white hover:border-[#333] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === 'uploading' ? 'READING...' : 'CHOOSE FILE (PDF/DOCX)'}
      </button>

      {fileName && status === 'idle' && !error && (
        <p className="text-xs text-[#666]">Loaded: {fileName} — edit below if needed</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
