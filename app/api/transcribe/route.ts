import { NextRequest, NextResponse } from 'next/server'
import OpenAI, { toFile } from 'openai'

const MAX_AUDIO_SIZE = 25 * 1024 * 1024 // OpenAI's own limit

// Client records with MediaRecorder and posts the blob here for transcription.
// No audio is persisted anywhere — it's read into memory and discarded once
// the transcript comes back.
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const audio = form.get('audio')

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'Missing audio' }, { status: 400 })
  }

  if (audio.size === 0) {
    return NextResponse.json({ error: "Didn't catch that — try again" }, { status: 422 })
  }

  if (audio.size > MAX_AUDIO_SIZE) {
    return NextResponse.json({ error: 'Audio too long' }, { status: 413 })
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const buffer = Buffer.from(await audio.arrayBuffer())
    const file = await toFile(buffer, audio.name || 'audio.webm', { type: audio.type || 'audio/webm' })

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'gpt-4o-transcribe',
    })

    const text = transcription.text.trim()

    if (!text) {
      return NextResponse.json({ error: "Didn't catch that — try again" }, { status: 422 })
    }

    return NextResponse.json({ text })
  } catch (err) {
    console.error('transcribe error:', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
