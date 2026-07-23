export type Country = { code: string; label: string }

// ANY, US, GB, UA pinned first for quick access; rest alphabetical by label.
export const COUNTRIES: Country[] = [
  { code: 'ANY', label: 'Any country' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'UA', label: 'Ukraine' },
  { code: 'AT', label: 'Austria' },
  { code: 'AU', label: 'Australia' },
  { code: 'BR', label: 'Brazil' },
  { code: 'CA', label: 'Canada' },
  { code: 'DE', label: 'Germany' },
  { code: 'ES', label: 'Spain' },
  { code: 'FR', label: 'France' },
  { code: 'IN', label: 'India' },
  { code: 'IT', label: 'Italy' },
  { code: 'MX', label: 'Mexico' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'NZ', label: 'New Zealand' },
  { code: 'PL', label: 'Poland' },
  { code: 'SG', label: 'Singapore' },
  { code: 'ZA', label: 'South Africa' },
]

// Countries Adzuna's search API covers. Others fall back to web search only.
export const ADZUNA_SUPPORTED_COUNTRY_CODES = new Set([
  'AT', 'AU', 'BR', 'CA', 'DE', 'FR', 'GB', 'IN', 'IT', 'MX', 'NL', 'NZ', 'PL', 'SG', 'US', 'ZA',
])

export type WorkFormat = 'ANY' | 'REMOTE' | 'HYBRID' | 'ONSITE'

export const WORK_FORMATS: WorkFormat[] = ['ANY', 'REMOTE', 'HYBRID', 'ONSITE']
