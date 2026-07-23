import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { searchJobs, type JobListing } from '@/lib/adzuna'
import { searchJobsViaWeb } from '@/lib/websearch'

const JOB_LIMIT = 10

type RankedJob = {
  title: string
  company: string
  url: string
  reason: string
  matchPercent: number
}

const EXTRACT_PROMPT =
  'Extract the desired job title and city/country from this resume. Respond with exactly two lines: "role: <one or two words>" then "location: <one or two words>". No other text.'

const RANK_PROMPT = (limit: number) => `You are a career consultant. You are given a candidate's resume and a list of job vacancies.
Pick up to ${limit} vacancies that fit best, based on skills, experience, and the stated role. Only pick vacancies that actually appear in the list below — never invent one. If fewer than ${limit} are a genuine fit, return only those. For each one, give a one-sentence explanation of why it fits this specific candidate, and a match percentage (an integer 60-99) reflecting how strong the fit is. Keep every reason under 20 words so the response stays compact.

Return the answer strictly as a JSON array:
[{"title": "...", "company": "...", "url": "...", "reason": "...", "matchPercent": 87}]
with no text before or after the JSON.`

function extractField(text: string, field: string): string {
  const match = text.match(new RegExp(`${field}\\s*:\\s*(.+)`, 'i'))
  return match ? match[1].trim() : ''
}

// Salvages whatever complete {...} objects it can if the model's output got cut off
// mid-array (a real, if infrequent, risk when max_tokens is reached).
function parseRankedJobs(raw: string): RankedJob[] {
  const start = raw.indexOf('[')
  if (start === -1) {
    throw new Error('No JSON array found in ranking response')
  }

  const end = raw.lastIndexOf(']')
  if (end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1))
    } catch {
      // fall through to salvage partial objects below
    }
  }

  const body = raw.slice(start + 1)
  const objects: RankedJob[] = []
  let depth = 0
  let objStart = -1

  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    if (ch === '{') {
      if (depth === 0) objStart = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && objStart !== -1) {
        try {
          objects.push(JSON.parse(body.slice(objStart, i + 1)))
        } catch {
          // skip malformed object and keep going
        }
        objStart = -1
      }
    }
  }

  if (objects.length === 0) {
    throw new Error('No JSON array found in ranking response')
  }
  return objects
}

// Adzuna descriptions in particular can run to hundreds of words; trimming keeps the
// ranking prompt (and therefore its latency/cost/truncation risk) predictable.
function trimForRanking(jobs: JobListing[]): JobListing[] {
  return jobs.map((job) => ({
    ...job,
    description: job.description.length > 400 ? `${job.description.slice(0, 400)}...` : job.description,
  }))
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
  const { resumeText, country, workFormat } = await req.json()

  if (!resumeText || typeof resumeText !== 'string') {
    return NextResponse.json({ error: 'Missing resumeText' }, { status: 400 })
  }

  const countryCode = typeof country === 'string' && country ? country : 'ANY'
  const format = typeof workFormat === 'string' && workFormat ? workFormat : 'ANY'

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

    if (jobs.length === 0) {
      return NextResponse.json({ jobs: [] })
    }

    const ranking = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: RANK_PROMPT(JOB_LIMIT) },
        {
          role: 'user',
          content: `RESUME:\n${resumeText}\n\nVACANCIES:\n${JSON.stringify(trimForRanking(jobs))}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 3500,
    })

    const rawRanking = ranking.choices[0].message.content ?? ''

    let rankedJobs: RankedJob[]
    try {
      rankedJobs = parseRankedJobs(rawRanking)
    } catch (parseErr) {
      console.error('Failed to parse ranking response:', parseErr, rawRanking)
      return NextResponse.json({ error: 'Could not rank vacancies, try again' }, { status: 502 })
    }

    return NextResponse.json({ jobs: rankedJobs.slice(0, JOB_LIMIT) })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('match-jobs error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
