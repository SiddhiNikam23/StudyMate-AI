import { NextRequest, NextResponse } from 'next/server'
import { getStreak, getQuizHistory } from '@/lib/redis'
import { DEMO_USER_ID } from '@/lib/constants'

export async function GET(req: NextRequest) {
  try {
    const userId = DEMO_USER_ID

    // Redis always works
    const [streak, quizHistory] = await Promise.all([
      getStreak(userId),
      getQuizHistory(userId),
    ])

    // Try Hindsight — gracefully skip if unavailable
    let dnaSummary = ''
    let recentMistakes: string[] = []
    let activities: any[] = []

    try {
      const { getUserDNASummary, recallMemories } = await import('@/lib/hindsight')
      const [summary, mists, acts] = await Promise.all([
        getUserDNASummary(userId),
        recallMemories(userId, 'recent mistakes and errors', 10),
        recallMemories(userId, 'recent study sessions and coding results', 10),
      ])
      dnaSummary = summary
      recentMistakes = mists
        .map((m) => (m as { content?: string; text?: string }).content
          ?? (m as { content?: string; text?: string }).text ?? '')
        .filter(Boolean)
      
      activities = acts.map(m => ({
        content: (m as any).content || (m as any).text || '',
        metadata: (m as any).metadata || {}
      }))
    } catch {
      console.warn('Hindsight unavailable — returning Redis data only')
      dnaSummary = quizHistory.length > 0
        ? `You have completed ${quizHistory.length} quiz session(s). Complete more quizzes to build your full DNA profile.`
        : 'No study sessions yet. Take a quiz to start building your learning DNA!'
    }

    // Build topic averages from quiz history
    const topicScores: Record<string, number[]> = {}
    quizHistory.forEach((q: { topic: string; score: number }) => {
      if (!topicScores[q.topic]) topicScores[q.topic] = []
      topicScores[q.topic].push(q.score)
    })

    const topicAverages = Object.entries(topicScores).map(([topic, scores]) => ({
      topic,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))

    return NextResponse.json({
      success: true,
      dnaSummary,
      recentMistakes,
      streak,
      topicAverages,
      quizHistory,
      activities,
    })
  } catch (err) {
    console.error('DNA fetch error:', err)
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    )
  }
}