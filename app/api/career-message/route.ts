import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export type MessageType = 'COVER_LETTER' | 'RECRUITER_OUTREACH' | 'LINKEDIN_NOTE' | 'FOLLOW_UP'
export type Audience = 'RECRUITER' | 'HIRING_MANAGER' | 'NETWORKING_CONTACT' | 'REFERRAL'
export type Style = 'CONFIDENT' | 'CASUAL' | 'FORMAL' | 'WARM'

// Shared "sound like a human, not a template" craft rules — the same spirit
// as the old cover-letter prompt in /api/polish, generalized across message
// types instead of being cover-letter-specific.
const BASE_PROMPT = `You are a career communication specialist. Turn raw input into a message that sounds like it was written by one specific person, not generated.

Sentence length: vary it. Never two sentences of the same length back to back.

Never start with I, My name is, or I am writing. First sentence must be a statement or specific fact.

Never use: Furthermore, Moreover, In addition, Additionally, Therefore, Thus, Hence, As a result, To summarize, In conclusion.

Take at least one concrete detail from the input and use it exactly. Do not convert specifics into general claims.

No em dashes. No semicolons for style. No three-part lists. No buzzwords: passionate, leveraging, synergy, impactful, results-driven, dynamic, detail-oriented, hardworking, team player, motivated, dedicated, eager.

Do not thank them for their time as a closing filler line. Close with one forward-facing sentence.

Output: the message only, no subject line, no commentary, no placeholders like [Name].`

const MESSAGE_TYPE_INSTRUCTIONS: Record<MessageType, string> = {
  COVER_LETTER: 'Format: cover letter for a job application. Length: 220-320 words, several short paragraphs.',
  RECRUITER_OUTREACH: 'Format: a cold outreach message opening a conversation with a recruiter or hiring manager. Length: 80-150 words. Get to the point in the first two sentences.',
  LINKEDIN_NOTE: 'Format: a LinkedIn connection request note. Hard limit: 300 characters. One or two sentences, no greeting like "Hi", go straight to why you are reaching out.',
  FOLLOW_UP: 'Format: a brief follow-up after applying or interviewing. Length: 60-120 words. Reference something specific from the input (the role, the conversation, a detail discussed) — do not write a generic check-in.',
}

const AUDIENCE_INSTRUCTIONS: Record<Audience, string> = {
  RECRUITER: 'Audience: a recruiter screening candidates. Lead with what makes this person worth a screening call.',
  HIRING_MANAGER: 'Audience: the hiring manager who will actually work with this person. Speak to fit and impact on their team, not generic qualifications.',
  NETWORKING_CONTACT: 'Audience: someone in the same industry, not actively hiring. Frame this as building a professional connection, not asking for a job.',
  REFERRAL: 'Audience: someone who could refer this person internally. Make it easy for them to forward — be specific about the ask.',
}

const STYLE_INSTRUCTIONS: Record<Style, string> = {
  CONFIDENT: 'Tone: confident and assertive, without overstating.',
  CASUAL: 'Tone: casual and conversational, like a real message between two professionals.',
  FORMAL: 'Tone: formal and polished, no slang or contractions.',
  WARM: 'Tone: warm and personable, while staying professional.',
}

export async function POST(req: NextRequest) {
  const { input, messageType, audience, style } = await req.json()

  if (!input || typeof input !== 'string') {
    return NextResponse.json({ error: 'Missing input' }, { status: 400 })
  }

  const typeInstruction = MESSAGE_TYPE_INSTRUCTIONS[messageType as MessageType]
  const audienceInstruction = AUDIENCE_INSTRUCTIONS[audience as Audience]
  const styleInstruction = STYLE_INSTRUCTIONS[style as Style]

  if (!typeInstruction || !audienceInstruction || !styleInstruction) {
    return NextResponse.json({ error: 'Invalid messageType, audience, or style' }, { status: 400 })
  }

  const systemPrompt = [BASE_PROMPT, typeInstruction, audienceInstruction, styleInstruction].join('\n\n')

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const result = response.choices[0].message.content
    return NextResponse.json({ result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('OpenAI error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
