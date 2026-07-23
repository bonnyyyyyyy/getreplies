type JobMatchCardProps = {
  title: string
  company: string
  reason: string
  url: string
}

export function JobMatchCard({ title, company, reason, url }: JobMatchCardProps) {
  return (
    <div className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl px-5 py-4 flex flex-col gap-2">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-[#666]">{company}</p>
      </div>
      <p className="text-sm text-[#ccc] leading-relaxed">{reason}</p>
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
