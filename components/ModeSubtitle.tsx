type Mode = 'CV' | 'LETTER'

const SUBTITLES: Record<Mode, string> = {
  CV: 'Turn your raw experience into a structured resume',
  LETTER: "Cover letters that don't sound like a template",
}

export function ModeSubtitle({ mode }: { mode: Mode }) {
  return (
    <p className="text-xs text-[#666] tracking-wide text-center mt-3 h-4">
      {SUBTITLES[mode]}
    </p>
  )
}
