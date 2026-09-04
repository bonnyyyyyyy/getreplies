type Plan = {
  key: string
  name: string
  price: string
  features: string[]
  note?: string
  highlighted?: boolean
  cta?: string
}

const PLANS: Plan[] = [
  {
    key: 'basic',
    name: 'basic',
    price: 'Free',
    features: ['limited size of CV', 'limited changes', 'limited jobs suggestions'],
  },
  {
    key: 'pro',
    name: 'pro',
    price: '9.99$/mth',
    features: ['unlimited size of CV', 'unlimited changes', 'unlimited jobs suggestions'],
    highlighted: true,
    cta: 'Get pro',
  },
  {
    key: 'uni',
    name: 'uni',
    price: 'Negotiable price',
    features: ['pro plan for universities domains', 'unlimited size of CV', 'unlimited changes', 'unlimited jobs suggestions'],
    note: 'please contact us to learn about details',
    cta: 'Get uni',
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-6 py-10">
      <div className="flex flex-col items-center text-center mb-14">
        <h1 className="text-4xl font-bold tracking-tight">Get More Replies!</h1>
        <p className="mt-4 text-base text-[#ddd]">Choose the plan that fits your goals</p>
      </div>

      <div className="w-full max-w-5xl grid md:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`flex flex-col rounded-2xl border border-[#1f1f1f] px-7 py-8 ${
              plan.highlighted ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]' : 'bg-black'
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold tracking-tight">{plan.name}</span>
              <span className="px-4 py-1.5 bg-white text-black text-xs font-semibold tracking-wide rounded-full">
                {plan.price}
              </span>
            </div>

            <ul className="flex flex-col gap-2 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="text-sm text-[#ccc] leading-relaxed list-disc list-inside">
                  {f}
                </li>
              ))}
            </ul>

            {plan.note && (
              <p className="mt-6 text-xs font-semibold text-white text-center">*{plan.note}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-8">
        {PLANS.filter((p) => p.cta).map((plan) => (
          // Design only for now — not wired to a checkout flow yet.
          <button
            key={plan.key}
            type="button"
            className="px-8 py-3 bg-white text-black text-sm font-semibold tracking-widest rounded-full hover:bg-[#e5e5e5] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {plan.cta}
          </button>
        ))}
      </div>
    </main>
  )
}
