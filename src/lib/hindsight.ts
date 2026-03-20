const HINDSIGHT_API_KEY = process.env.HINDSIGHT_API_KEY!
const HINDSIGHT_BASE_URL = process.env.HINDSIGHT_BASE_URL!

interface HindsightMemory {
  text?: string
  content?: string
  metadata?: Record<string, unknown>
}

async function hindsightPost(path: string, body: object): Promise<unknown> {
  try {
    const url = `${HINDSIGHT_BASE_URL}${path}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HINDSIGHT_API_KEY}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text()
      console.warn(`Hindsight ${path} → ${res.status}: ${errText}`)
      return null
    }
    return res.json()
  } catch (err) {
    console.warn(`Hindsight ${path} failed — skipping:`, err)
    return null
  }
}

export async function rememberFact(
  userId: string,
  content: string,
  metadata?: Record<string, unknown>
) {
  const bankId = `user_${userId}`
  // Correct endpoint: POST /v1/default/banks/{bank_id}/memories
  // Body uses "items" array
  return hindsightPost(
    `/v1/default/banks/${bankId}/memories`,
    {
      items: [{ content, metadata: metadata ?? {} }],
      async: true  // process in background — faster response
    }
  )
}

export async function recallMemories(
  userId: string,
  query: string,
  limit = 10
): Promise<HindsightMemory[]> {
  const bankId = `user_${userId}`
  const data = await hindsightPost(
    `/v1/default/banks/${bankId}/memories/recall`,
    { query, max_tokens: 1000 }
  ) as { results?: HindsightMemory[] } | null

  return data?.results ?? []
}

export async function reflectOnMemories(
  userId: string,
  query: string
): Promise<string> {
  const bankId = `user_${userId}`
  const data = await hindsightPost(
    `/v1/default/banks/${bankId}/reflect`,
    { query, budget: 'low' }
  ) as { text?: string } | null

  return data?.text ?? ''
}

export async function logMistake(
  userId: string,
  topic: string,
  question: string,
  wrongAnswer: string,
  correctAnswer: string
) {
  await rememberFact(
    userId,
    `MISTAKE: User got "${question}" wrong. Answered "${wrongAnswer}" but correct is "${correctAnswer}". Topic: ${topic}`,
    { type: 'mistake', topic, timestamp: String(Date.now()) }  // ← String()
  )
}

export async function logCodeMistake(
  userId: string,
  problemTitle: string,
  errorType: string,
  code: string,
  topic?: string
) {
  await rememberFact(
    userId,
    `CODE MISTAKE: User failed "${problemTitle}" in topic "${topic ?? 'General'}" with error type "${errorType}".`,
    {
      type: 'code_mistake',
      topic: topic ?? 'General',
      errorType,
      problemTitle,
      timestamp: String(Date.now())
    }  // ← String()
  )
}

export async function logStudySession(
  userId: string,
  topic: string,
  score: number,
  timeSpent: number
) {
  await rememberFact(
    userId,
    `STUDY SESSION: Completed ${topic} quiz. Score: ${score}%. Time: ${timeSpent}s.`,
    {                                    // ← all numbers → strings
      type: 'session',
      topic,
      score: String(score),
      timeSpent: String(timeSpent),
      timestamp: String(Date.now())
    }
  )
}

export async function getUserDNASummary(userId: string): Promise<string> {
  return reflectOnMemories(
    userId,
    "Provide a warm, encouraging, and clear summary of this student's learning journey. Highlight their strengths, specify exactly which topics need more focus, and identify recurring mistake patterns. Give actionable, friendly advice on how to improve. Avoid sounding like a machine; be a supportive mentor. Use clear paragraphs."
  )
}