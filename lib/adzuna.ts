import { ADZUNA_SUPPORTED_COUNTRY_CODES } from './jobFilters'

export type JobListing = {
  title: string
  company: string
  description: string
  url: string
  location: string
}

type AdzunaJob = {
  title?: string
  company?: { display_name?: string }
  description?: string
  redirect_url?: string
  location?: { display_name?: string }
}

type AdzunaSearchResponse = {
  results?: AdzunaJob[]
}

const RESULTS_PER_PAGE = 30

export async function searchJobs(
  query: string,
  location: string,
  countryCode: string,
  workFormat: string
): Promise<JobListing[]> {
  if (countryCode === 'ANY' || !ADZUNA_SUPPORTED_COUNTRY_CODES.has(countryCode)) {
    return []
  }

  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  if (!appId || !appKey) {
    throw new Error('Missing ADZUNA_APP_ID or ADZUNA_APP_KEY')
  }

  const what = workFormat && workFormat !== 'ANY' ? `${query} ${workFormat.toLowerCase()}` : query

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${countryCode.toLowerCase()}/search/1`)
  url.searchParams.set('app_id', appId)
  url.searchParams.set('app_key', appKey)
  url.searchParams.set('what', what)
  url.searchParams.set('where', location)
  url.searchParams.set('results_per_page', String(RESULTS_PER_PAGE))
  url.searchParams.set('content-type', 'application/json')

  const res = await fetch(url.toString())

  if (!res.ok) {
    throw new Error(`Adzuna request failed: ${res.status} ${await res.text()}`)
  }

  const data: AdzunaSearchResponse = await res.json()

  return (data.results ?? []).map((job) => ({
    title: job.title ?? '',
    company: job.company?.display_name ?? '',
    description: job.description ?? '',
    url: job.redirect_url ?? '',
    location: job.location?.display_name ?? '',
  }))
}
