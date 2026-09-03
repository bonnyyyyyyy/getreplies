import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// This route is now CV-only — cover letters and other message types moved to
// /api/career-message under the Career Strategist tool.
const SYSTEM_PROMPT = `You are a resume writing specialist. Turn raw, unstructured personal input (experience, skills, what they're looking for) into a clean, structured resume text, plus a short honest assessment of the resume itself.

Structure the resume text, in this order:
1. Headline: desired role/title, one line.
2. Summary: 2-3 sentences on who they are professionally and what they're looking for.
3. Experience: each role as a line with company, title, dates if given, and 1-3 bullet-style achievement lines starting with strong verbs. Use concrete numbers and outcomes from the input wherever they exist. Do not invent employers, dates, titles, or metrics that are not in the input.
4. Skills: a flat comma-separated list pulled from the input.
5. Desired role / location: one line, inferred from the input if stated.

Use plain text with line breaks between sections, no markdown headers, no tables. Keep every claim traceable to something in the input. If the input is missing a section entirely, omit that section rather than padding it with generic filler.

No buzzwords: passionate, synergy, dynamic, results-driven, team player, hardworking, detail-oriented, go-getter. No em dashes.

Tone: precise, factual, confident.

Then assess the resume you just wrote: 2-4 concrete strengths (what will actually land with a recruiter) and 2-4 concrete weaknesses (gaps, vague claims, missing numbers, thin sections). Base this only on what is or isn't in the input — do not invent problems that aren't there.

Respond with ONLY a JSON object, no markdown fences, in this exact shape:
{"resume": "the resume text", "strengths": ["...", "..."], "weaknesses": ["...", "..."]}`

const TONE_INSTRUCTIONS: Record<string, string> = {
  CONFIDENT: '\n\nRewrite the resume tone to be noticeably more confident and assertive, without adding new claims or buzzwords.',
  CASUAL: '\n\nRewrite the resume tone to be noticeably more casual and conversational, while keeping every fact.',
  SHORTER: '\n\nCut the resume by roughly a third. Keep only the strongest sentences and details.',
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return fenced ? fenced[1] : trimmed
}

export async function POST(req: NextRequest) {
  const { message, tone } = await req.json()

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 })
  }

  const systemPrompt = typeof tone === 'string' && TONE_INSTRUCTIONS[tone]
    ? SYSTEM_PROMPT + TONE_INSTRUCTIONS[tone]
    : SYSTEM_PROMPT

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    })

    const raw = response.choices[0].message.content ?? '{}'
    let parsed: { resume?: string; strengths?: string[]; weaknesses?: string[] }

    try {
      parsed = JSON.parse(stripJsonFence(raw))
    } catch {
      parsed = {}
    }

    if (!parsed.resume) {
      return NextResponse.json({ error: 'Could not generate a resume from that input' }, { status: 500 })
    }

    return NextResponse.json({
      result: parsed.resume,
      feedback: {
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('OpenAI error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
