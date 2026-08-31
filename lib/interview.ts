import OpenAI from 'openai'

export type PrepResult = {
  role_criteria: string[]
  role_pain: string
  red_flags: string[]
}

export type InterviewAction = 'follow_up' | 'next_question' | 'conclude'

export type LoopResult = {
  action: InterviewAction
  message: string
  internal_note?: string
}

export type CriterionScore = {
  criterion: string
  status: 'pass' | 'borderline' | 'fail'
  comment: string
}

export type Evaluation = {
  verdict: 'advance' | 'borderline' | 'pass'
  verdict_reason: string
  criteria_scores: CriterionScore[]
  weak_spots: string[]
  skill_defense: string[]
}

export type ChatTurn = { role: 'interviewer' | 'candidate'; content: string }

function stripJsonFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
}

function safeParseJson<T>(raw: string): T {
  return JSON.parse(stripJsonFence(raw)) as T
}

const PREP_SYSTEM = `You are an experienced recruiter analyzing a job posting and a candidate's resume before an interview.

Given the job description and resume, identify:
- role_criteria: 3-4 REAL things a recruiter would actually check for this role (not keywords copy-pasted from the posting — the underlying capabilities the team needs).
- role_pain: one sentence describing what pain or gap on the team this role exists to close.
- red_flags: potential weak points in THIS candidate's resume that a recruiter would likely probe (employment gaps, frequent job-hopping, seniority mismatch with the role, achievements stated without numbers or results, etc).

Respond with strict JSON only, no text before or after:
{"role_criteria": ["...", "..."], "role_pain": "...", "red_flags": ["...", "..."]}`

export async function runPrep(jobDescription: string, resumeText: string): Promise<PrepResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: PREP_SYSTEM },
      { role: 'user', content: `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resumeText}` },
    ],
    temperature: 0.4,
    max_tokens: 600,
  })

  return safeParseJson<PrepResult>(response.choices[0].message.content ?? '{}')
}

function loopSystemPrompt(prep: PrepResult): string {
  return `You are a strict but fair recruiter/hiring manager conducting a live interview for this role.

Context from prep:
- What the role really needs: ${prep.role_criteria.join('; ')}
- Pain this role closes: ${prep.role_pain}
- Candidate's potential red flags to probe: ${prep.red_flags.join('; ')}

Rules:
- Early in the interview, look for reasons to say no — don't go easy.
- Catch vague answers: no numbers or results, "we" instead of "I", process described without an outcome, defensiveness when a weak point is raised.
- On a weak or vague answer: ask a sharper follow-up, escalating — e.g. "okay, but what exactly did YOU do?" Do not move to the next question yet.
- On a sufficient answer: move to the next question.
- You MUST touch at least one of the candidate's red flags during the session.
- Keep the interview to 6-10 exchanges total, then it is fine to conclude.
- Respond in the same language the candidate is using.
- Sound like a real person, not a form. Ask ONE thing at a time — never dump a list of questions.
- If there is no candidate turn yet, this is the opening — ask the first question.

Respond with strict JSON only, no text before or after:
{"action": "follow_up" | "next_question" | "conclude", "message": "your next spoken line to the candidate", "internal_note": "why you chose this, not shown to the candidate"}`
}

export async function runInterviewStep(prep: PrepResult, turns: ChatTurn[]): Promise<LoopResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: loopSystemPrompt(prep) },
    ...turns.map((t) => ({
      role: t.role === 'interviewer' ? ('assistant' as const) : ('user' as const),
      content: t.content,
    })),
  ]

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages,
    temperature: 0.6,
    max_tokens: 400,
  })

  return safeParseJson<LoopResult>(response.choices[0].message.content ?? '{}')
}

const EVAL_SYSTEM = `You are a recruiter writing the internal debrief right after conducting this interview.

Score the whole session honestly using the role criteria and red flags identified before the interview:
- verdict: "advance" | "borderline" | "pass", plus a candid one-line internal reason (verdict_reason).
- criteria_scores: for each role criterion, whether the candidate passed, was borderline, or failed it, with a short comment.
- weak_spots: 2-4 concrete weak points, each with a specific suggestion for how to answer better next time.
- skill_defense: skills the candidate claimed but could not defend under questioning — "push harder on this or drop it from the resume."

Respond with strict JSON only, no text before or after:
{"verdict": "advance"|"borderline"|"pass", "verdict_reason": "...", "criteria_scores": [{"criterion": "...", "status": "pass"|"borderline"|"fail", "comment": "..."}], "weak_spots": ["..."], "skill_defense": ["..."]}`

export async function runEvaluation(prep: PrepResult, turns: ChatTurn[]): Promise<Evaluation> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const transcript = turns.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n')

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EVAL_SYSTEM },
      {
        role: 'user',
        content: `ROLE CRITERIA: ${prep.role_criteria.join('; ')}\nRED FLAGS TO CHECK: ${prep.red_flags.join('; ')}\n\nTRANSCRIPT:\n${transcript}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1200,
  })

  return safeParseJson<Evaluation>(response.choices[0].message.content ?? '{}')
}
