function copyForLength(length: number): string {
  if (length === 0) return ''
  if (length < 80) return 'keep going'
  if (length < 400) return 'looking good'
  if (length < 900) return "getting long — we'll trim it"
  return "that's a lot — we'll focus on what matters"
}

export function LiveCharCounter({ length }: { length: number }) {
  if (length === 0) return null

  return (
    <p className="absolute bottom-3 right-4 text-[10px] text-[#444] tracking-wide select-none">
      {length} chars · {copyForLength(length)}
    </p>
  )
}
