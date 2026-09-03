import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromFile, isSupportedResumeFile } from '@/lib/resumeParse'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  if (!isSupportedResumeFile(file.type, file.name)) {
    return NextResponse.json({ error: 'Only PDF and DOCX files are supported' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File is too large (max 10 MB)' }, { status: 413 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractTextFromFile(buffer, file.type, file.name)

    if (!text) {
      return NextResponse.json({ error: 'Could not find any text in that file' }, { status: 422 })
    }

    return NextResponse.json({ text })
  } catch (err) {
    console.error('parse-resume error:', err)
    return NextResponse.json({ error: 'Could not read that file' }, { status: 500 })
  }
}
