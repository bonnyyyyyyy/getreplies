import OpenAI from 'openai'
import type { JobListing } from './adzuna'
import { COUNTRIES } from './jobFilters'

function parseJobListings(raw: string): JobListing[] {
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1) {
    throw new Error('No JSON array found in web search response')
  }
  return JSON.parse(raw.slice(start, end + 1))
}

export async function searchJobsViaWeb(
  role: string,
  countryCode: string,
  workFormat: string
): Promise<JobListing[]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const country = COUNTRIES.find((c) => c.code === countryCode)
  const locationClause = country && country.code !== 'ANY' ? ` in ${country.label}` : ' anywhere in the world'
  const formatClause = workFormat && workFormat !== 'ANY' ? `, ${workFormat.toLowerCase()} work format` : ''

  const prompt = `Search the web (LinkedIn, Indeed, company career pages, and other job boards) for real, currently open job postings for the role "${role}"${locationClause}${formatClause}.

Return up to 15 postings as a strict JSON array, no text before or after:
[{"title": "...", "company": "...", "url": "...", "description": "...", "location": "..."}]

Only include postings with a real URL found in your search results. Do not invent postings or URLs.`

  const response = await client.responses.create({
    model: 'gpt-4o',
    input: prompt,
    tools: [
      {
        type: 'web_search',
        ...(country && country.code !== 'ANY'
          ? { user_location: { type: 'approximate', country: country.code } }
          : {}),
      },
    ],
  })

  try {
    return parseJobListings(response.output_text)
  } catch (err) {
    console.error('Failed to parse web search job results:', err, response.output_text)
    return []
  }
}
