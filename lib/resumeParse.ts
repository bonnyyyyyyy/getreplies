// Extracts plain text from an uploaded resume file (PDF or DOCX) so it can
// be dropped into the same flow as pasted/dictated text.

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
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      return result.text.trim()
    } finally {
      await parser.destroy()
    }
  }

  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value.trim()
}
