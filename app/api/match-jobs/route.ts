import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { checkAndConsumeUsage } from '@/lib/usage'
import { searchJobs, type JobListing } from '@/lib/adzuna'
import { searchJobsViaWeb } from '@/lib/websearch'

type RankedJob = {
  title: string
  company: string
  url: string
  reason: string
}

const EXTRACT_PROMPT =
  'Extract the desired job title and city/country from this resume. Respond with exactly two lines: "role: <one or two words>" then "location: <one or two words>". No other text.'

const RANK_PROMPT = (limit: number) => `You are a career consultant. You are given a candidate's resume and a list of job vacancies.
Pick the ${limit} vacancies that fit best, based on skills, experience, and the stated role. For each one, give a short explanation (1-2 sentences) of why it fits this specific candidate.

Return the answer strictly as a JSON array:
[{"title": "...", "company": "...", "url": "...", "reason": "..."}]
with no text before or after the JSON.`

function extractField(text: string, field: string): string {
  const match = text.match(new RegExp(`${field}\\s*:\\s*(.+)`, 'i'))
  return match ? match[1].trim() : ''
}

function parseRankedJobs(raw: string): RankedJob[] {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1) {
    throw new Error('No JSON array found in ranking response')
  }
  return JSON.parse(raw.slice(start, end + 1))
}

function dedupeByUrl(jobs: JobListing[]): JobListing[] {
  const seen = new Set<string>()
  return jobs.filter((job) => {
    if (!job.url || seen.has(job.url)) return false
    seen.add(job.url)
    return true
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  const { resumeText, country, workFormat } = await req.json()

  if (!resumeText || typeof resumeText !== 'string') {
    return NextResponse.json({ error: 'Missing resumeText' }, { status: 400 })
  }

  const countryCode = typeof country === 'string' && country ? country : 'ANY'
  const format = typeof workFormat === 'string' && workFormat ? workFormat : 'ANY'

  const usage = await checkAndConsumeUsage(supabase, claims.sub)
  if (!usage.allowed) {
    return NextResponse.json({ paywall: true })
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const extraction = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: EXTRACT_PROMPT },
        { role: 'user', content: resumeText },
      ],
      temperature: 0,
      max_tokens: 50,
    })

    const extracted = extraction.choices[0].message.content ?? ''
    const role = extractField(extracted, 'role')
    const location = extractField(extracted, 'location')

    const [adzunaJobs, webJobs] = await Promise.all([
      searchJobs(role, location, countryCode, format).catch((err) => {
        console.error('Adzuna search failed:', err)
        return [] as JobListing[]
      }),
      searchJobsViaWeb(role, countryCode, format).catch((err) => {
        console.error('Web search failed:', err)
        return [] as JobListing[]
      }),
    ])

    const jobs: JobListing[] = dedupeByUrl([...adzunaJobs, ...webJobs])

    const ranking = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: RANK_PROMPT(usage.jobLimit) },
        {
          role: 'user',
          content: `RESUME:\n${resumeText}\n\nVACANCIES:\n${JSON.stringify(jobs)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const rawRanking = ranking.choices[0].message.content ?? ''

    let rankedJobs: RankedJob[]
    try {
      rankedJobs = parseRankedJobs(rawRanking)
    } catch (parseErr) {
      console.error('Failed to parse ranking response:', parseErr, rawRanking)
      return NextResponse.json({ error: 'Could not rank vacancies, try again' }, { status: 502 })
    }

    return NextResponse.json({ jobs: rankedJobs.slice(0, usage.jobLimit) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('match-jobs error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
