const EXAMPLE_TEXT =
  "I've spent the last 3 years as a frontend dev at a startup, mostly React and TypeScript. Led a small team on a dashboard rebuild that cut load time in half. Looking for a senior role, remote, ideally product-focused."

export function ExampleChip({ onInsert }: { onInsert: (text: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onInsert(EXAMPLE_TEXT)}
      className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[10px] font-semibold tracking-widest text-[#555] border border-[#1f1f1f] bg-black/40 backdrop-blur-sm hover:text-white hover:border-[#333] transition-all"
    >
      TRY AN EXAMPLE
    </button>
  )
}
