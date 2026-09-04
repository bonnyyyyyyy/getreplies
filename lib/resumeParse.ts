// Extracts plain text from an uploaded resume file (PDF or DOCX) so it can
// be dropped into the same flow as pasted/dictated text.

import path from 'node:path'

// pdf-parse (via pdfjs-dist) normally locates its worker file relative to its
// own bundled module path. Next.js's bundler flattens everything into a
// single server chunk, which breaks that relative lookup ("Cannot find
// module '.../pdf.worker.mjs'"). Pointing it at the on-disk file explicitly
// sidesteps that — see next.config.ts's outputFileTracingIncludes for why
// this file is guaranteed to exist in the deployed function bundle too.
//
// Deliberately NOT require.resolve() here: Turbopack statically intercepts
// that call and rewrites it to an internal bundler placeholder instead of a
// real filesystem path, which breaks the runtime dynamic import inside
// pdfjs-dist. A plain path.join() is invisible to the bundler and survives
// as an actual path at runtime.
let workerConfigured = false
async function ensurePdfWorker() {
  if (workerConfigured) return
  const { PDFParse } = await import('pdf-parse')
  PDFParse.setWorker(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'))
  workerConfigured = true
}

const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export function isSupportedResumeFile(mimeType: string, fileName: string): boolean {
  if (SUPPORTED_MIME_TYPES.has(mimeType)) return true
  // Some browsers/OSes send a generic octet-stream mime — fall back to extension.
  const lower = fileName.toLowerCase()
  return lower.endsWith('.pdf') || lower.endsWith('.docx')
}

export async function extractTextFromFile(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')

  if (isPdf) {
    await ensurePdfWorker()
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    try {
      // result.text is a concatenated string with "-- N of M --" page
      // separators baked in — join the clean per-page text ourselves instead.
      const result = await parser.getText()
      return result.pages.map((p) => p.text).join('\n\n').trim()
    } finally {
      await parser.destroy()
    }
  }

  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value.trim()
}
