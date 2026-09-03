'use client'

import { useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'recording' | 'transcribing'

type VoiceInputButtonProps = {
  onTranscript: (text: string) => void
  disabled?: boolean
}

const MAX_RECORDING_SECONDS = 120

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  for (const type of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return undefined
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [supported] = useState(
    () =>
      typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined'
  )

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const transcribe = async (blob: Blob) => {
    setStatus('transcribing')
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.')
        return
      }

      onTranscript(data.text)
    } catch (err) {
      console.error('transcribe request error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setStatus('idle')
      setSeconds(0)
    }
  }

  const startRecording = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stopStream()
        if (timerRef.current) clearInterval(timerRef.current)
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        transcribe(blob)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setStatus('recording')
      setSeconds(0)

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1
          if (next >= MAX_RECORDING_SECONDS) {
            recorder.stop()
          }
          return next
        })
      }, 1000)
    } catch (err) {
      console.error('getUserMedia error:', err)
      setError('Allow microphone access in your browser to use voice input.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  if (!supported) return null

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={status === 'recording' ? stopRecording : startRecording}
        disabled={disabled || status === 'transcribing'}
        className={`self-start flex items-center gap-2 px-5 py-2 text-xs font-semibold tracking-widest rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          status === 'recording'
            ? 'bg-red-500/10 border border-red-500/40 text-red-400'
            : 'bg-transparent border border-[#1f1f1f] text-white hover:border-[#333]'
        }`}
      >
        {status === 'recording' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
        {status === 'idle' && '● RECORD'}
        {status === 'recording' && `STOP · ${formatTime(seconds)}`}
        {status === 'transcribing' && 'TRANSCRIBING...'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
