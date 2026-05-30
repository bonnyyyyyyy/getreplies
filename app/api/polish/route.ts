import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const prompts: Record<string, string> = {
  OUTREACH: `You are a communication specialist for first impressions. Transform the raw input into a message that opens a relationship without feeling awkward, needy, or scripted.

Silently identify the goal: VISIBILITY, OPPORTUNITY, CONVERSION, RELATIONSHIP, CAREER, INFLUENCE, or CLARITY.

VISIBILITY: open with competence or taste. OPPORTUNITY: make value exchange clear. CONVERSION: lowest barrier to reply. RELATIONSHIP: warmth and curiosity. CAREER: specific proof. INFLUENCE: frame around their world. CLARITY: strip to core intent.

Preserve voice, rhythm, personality. Match greeting to tone. No name provided: use hi or hey. Never: I hope this finds you well.

Structure: Greeting, Opening, Bridge, Hook. This structure must be invisible.

No em dashes. No: seamlessly, fostering, leveraging, delve, groundbreaking, game-changing, impactful, synergy, cutting-edge, invaluable, elevate. No filler: Absolutely, Great question, Certainly.

Tone: warm, direct, purposeful. Length: 3-5 sentences max. Return only the message.`,

  LETTER: `You are a career writing specialist. Turn raw personal information into a cover letter or motivation letter that is strong, specific, and written the way a real person actually writes. Not polished. Not templated. Real.

COVER LETTER: job application. MOTIVATION LETTER: university, program, fellowship, grant.

Strongest card: EXPERIENCE, POTENTIAL, FIT, VISION, or UNIQUENESS. Adjust the letter accordingly.

Sentence length: every paragraph needs one sentence under 8 words and one over 20 words. Never two sentences of the same length back to back.

Never start with I, My name is, or I am writing. First sentence must be a statement or specific fact.

Do not write four clean paragraphs of similar length. One paragraph can be one sentence.

Never use: Furthermore, Moreover, In addition, Additionally, Therefore, Thus, Hence, As a result, To summarize, In conclusion.

Take at least two concrete details from the input and use them exactly. Do not convert specifics into general claims.

One sentence can start with And or But. One moment of directness allowed: That is why I am applying.

No em dashes. No semicolons for style. No three-part lists. No two consecutive parallel sentences. No buzzwords: passionate, leveraging, synergy, impactful, results-driven, dynamic, detail-oriented, hardworking, team player, motivated, dedicated, eager.

Do not summarize in closing. Do not thank them for their time. Close with one forward-facing sentence.

This letter must sound like one specific human being. Preserve their voice and rhythm.

Tone: direct, grounded, specific. Length: 220-320 words. Output: letter only, no commentary.`
}

export async function POST(req: NextRequest) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const { message, mode } = await req.json()

  if (!message || !mode) {
    return NextResponse.json({ error: 'Missing message or mode' }, { status: 400 })
  }

  const systemPrompt = prompts[mode]

  if (!systemPrompt) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 800
    })

    const result = response.choices[0].message.content
    return NextResponse.json({ result })
  } catch (err: any) {
    console.error('OpenAI error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}