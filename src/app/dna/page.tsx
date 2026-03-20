'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, LineChart, Line, CartesianGrid
} from 'recharts'

interface DNAData {
  dnaSummary: string
  recentMistakes: string[]
  streak: number
  topicAverages: { topic: string; avg: number }[]
  quizHistory: { topic: string; score: number; total: number; timestamp: number }[]
  activities?: { content: string; metadata: any }[]
}

const RAMP = ['#7c3aed','#6d28d9','#8b5cf6','#a78bfa','#5b21b6','#4c1d95']

export default function DNAPage() {
  const [data, setData] = useState<DNAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview'|'mistakes'|'behaviour'|'timeline'|'history'>('overview')

  useEffect(() => {
    fetch('/api/dna')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <LoadingDNA />

  const radarData = (data?.topicAverages ?? []).map(t => ({
    topic: t.topic.split(' ')[0],
    score: t.avg,
    fullMark: 100,
  }))

  const timelineData = (data?.quizHistory ?? [])
    .slice(0, 10)
    .reverse()
    .map((q, i) => ({
      attempt: i + 1,
      score: q.score,
      topic: q.topic,
    }))

  const weakTopics = (data?.topicAverages ?? [])
    .filter(t => t.avg < 60)
    .sort((a, b) => a.avg - b.avg)

  const strongTopics = (data?.topicAverages ?? [])
    .filter(t => t.avg >= 70)
    .sort((a, b) => b.avg - a.avg)

  const mistakePatterns = parseMistakePatterns(data?.recentMistakes ?? [])

  const SECTIONS = [
    { id: 'overview',   label: 'Overview',   icon: '🧬' },
    { id: 'mistakes',   label: 'Mistakes',   icon: '⚠️' },
    { id: 'behaviour',  label: 'Behaviour',  icon: '🎯' },
    { id: 'timeline',   label: 'Timeline',   icon: '📈' },
    { id: 'history',    label: 'History',    icon: '📜' },
  ] as const

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-200 text-sm">← Dashboard</Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100">Learning DNA</h1>
              <span className="text-xs bg-violet-900/40 text-violet-400 px-2 py-1 rounded-full border border-violet-700/40">
                Hindsight Memory
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">Your complete learning profile — concepts, patterns, behaviour</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-violet-400">{data?.streak ?? 0} 🔥</div>
          <div className="text-xs text-slate-400">day streak</div>
        </div>
      </div>

      {/* DNA Score Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <DNACard
          label="DNA Score"
          value={calcDNAScore(data)}
          suffix="/100"
          color="violet"
          sub="Overall learning health"
        />
        <DNACard
          label="Weak Topics"
          value={weakTopics.length}
          color="red"
          sub="Need attention"
        />
        <DNACard
          label="Strong Topics"
          value={strongTopics.length}
          color="emerald"
          sub="Mastered"
        />
        <DNACard
          label="Mistakes Logged"
          value={data?.recentMistakes?.length ?? 0}
          color="amber"
          sub="In Hindsight memory"
        />
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 bg-[#1a1a2e] p-1 rounded-xl w-fit">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
              activeSection === s.id
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Radar */}
            <div className="card">
              <h2 className="font-semibold text-slate-200 mb-1">Topic Mastery Radar</h2>
              <p className="text-xs text-slate-500 mb-4">Your strengths vs weaknesses at a glance</p>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e3a5f" />
                    <PolarAngleAxis dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Radar name="Score" dataKey="score"
                      stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.35} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <EmptyState msg="Complete quizzes to build your radar" />}
            </div>

            {/* AI DNA Summary */}
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <span>🧬</span>
                <h2 className="font-semibold text-slate-200">AI Analysis</h2>
                <span className="text-xs bg-violet-900/30 text-violet-400 px-2 py-0.5 rounded-full">
                  Hindsight reflect
                </span>
              </div>
              {data?.dnaSummary ? (
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {data.dnaSummary}
                </p>
              ) : (
                <div className="text-sm text-slate-500">
                  <p>No analysis yet. Complete a few quizzes first.</p>
                  <Link href="/quiz" className="text-violet-400 hover:text-violet-300 mt-2 inline-block text-sm">
                    Take a quiz →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Weak vs Strong */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card border-red-900/30">
              <h2 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                <span>🔴</span> Weak Topics — Focus Here
              </h2>
              {weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {weakTopics.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-32 truncate">{t.topic}</span>
                      <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${t.avg}%` }}
                        />
                      </div>
                      <span className="text-xs text-red-400 w-8 text-right">{t.avg}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No weak topics yet — keep quizzing!</p>
              )}
            </div>

            <div className="card border-emerald-900/30">
              <h2 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <span>🟢</span> Strong Topics — Mastered
              </h2>
              {strongTopics.length > 0 ? (
                <div className="space-y-2">
                  {strongTopics.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-32 truncate">{t.topic}</span>
                      <div className="flex-1 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${t.avg}%` }}
                        />
                      </div>
                      <span className="text-xs text-emerald-400 w-8 text-right">{t.avg}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Score 70%+ on a topic to show here.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MISTAKES */}
      {activeSection === 'mistakes' && (
        <div className="space-y-6">

          {/* Pattern breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Concept Gaps',    count: mistakePatterns.concept,    color: 'red',    icon: '🧠', desc: 'Wrong understanding of concepts' },
              { label: 'Edge Cases',      count: mistakePatterns.edgeCase,   color: 'amber',  icon: '⚡', desc: 'Missed boundary conditions' },
              { label: 'Logic Errors',    count: mistakePatterns.logic,      color: 'orange', icon: '🔀', desc: 'Incorrect reasoning chain' },
              { label: 'Time Pressure',   count: mistakePatterns.time,       color: 'blue',   icon: '⏱️', desc: 'Ran out of time' },
              { label: 'Silly Mistakes',  count: mistakePatterns.silly,      color: 'purple', icon: '🤦', desc: 'Careless errors' },
              { label: 'Code Mistakes',   count: mistakePatterns.code,       color: 'cyan',   icon: '💻', desc: 'Programming errors' },
            ].map((p) => (
              <div key={p.label} className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span>{p.icon}</span>
                  <span className="text-sm font-medium text-slate-200">{p.label}</span>
                </div>
                <div className="text-3xl font-bold text-slate-100 mb-1">{p.count}</div>
                <p className="text-xs text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Raw mistake log */}
          <div className="card">
            <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span>📋</span> Hindsight Mistake Log
              <span className="text-xs bg-violet-900/30 text-violet-400 px-2 py-0.5 rounded-full ml-auto">
                {data?.recentMistakes?.length ?? 0} entries
              </span>
            </h2>
            {data?.recentMistakes && data.recentMistakes.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {data.recentMistakes.map((m, i) => (
                  <div key={i}
                    className="bg-[#1a1a2e] border border-[#1e3a5f]/50 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
                    <span className="text-violet-400 mr-2">#{i + 1}</span>
                    {m.replace('MISTAKE: ', '').replace('CODE MISTAKE: ', '').replace('STUDY SESSION: ', '')}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No mistakes logged yet.</p>
                <Link href="/quiz" className="btn-primary mt-3 inline-block text-sm">
                  Take a quiz to populate memory
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BEHAVIOUR */}
      {activeSection === 'behaviour' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Behaviour flags */}
            <div className="card">
              <h2 className="font-semibold text-slate-200 mb-4">Behaviour Flags</h2>
              <div className="space-y-3">
                {[
                  {
                    flag: 'Skips edge cases',
                    detected: mistakePatterns.edgeCase > 2,
                    tip: 'Always test with empty input, single element, and max bounds.',
                  },
                  {
                    flag: 'Time pressure issues',
                    detected: mistakePatterns.time > 1,
                    tip: 'Practice with a timer. Aim to solve easy problems in under 5 min.',
                  },
                  {
                    flag: 'Concept confusion',
                    detected: mistakePatterns.concept > 3,
                    tip: 'Revisit fundamentals. Use flashcards for definitions.',
                  },
                  {
                    flag: 'Careless errors',
                    detected: mistakePatterns.silly > 2,
                    tip: 'Read questions twice before answering. Slow down.',
                  },
                ].map((b, i) => (
                  <div key={i} className={`rounded-xl p-4 border ${
                    b.detected
                      ? 'bg-red-900/20 border-red-800/40'
                      : 'bg-emerald-900/10 border-emerald-800/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{b.detected ? '🚩' : '✅'}</span>
                      <span className={`text-sm font-medium ${b.detected ? 'text-red-300' : 'text-emerald-300'}`}>
                        {b.flag}
                      </span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                        b.detected
                          ? 'bg-red-900/50 text-red-400'
                          : 'bg-emerald-900/50 text-emerald-400'
                      }`}>
                        {b.detected ? 'Detected' : 'Clear'}
                      </span>
                    </div>
                    {b.detected && (
                      <p className="text-xs text-slate-400 ml-6">{b.tip}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Topic score bar chart */}
            <div className="card">
              <h2 className="font-semibold text-slate-200 mb-1">Performance by Topic</h2>
              <p className="text-xs text-slate-500 mb-4">Average quiz scores</p>
              {data?.topicAverages && data.topicAverages.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.topicAverages} barSize={24}>
                    <XAxis dataKey="topic" tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={v => v.split(' ')[0]} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#16213e', border: '1px solid #1e3a5f', borderRadius: 8 }}
                      labelStyle={{ color: '#f1f5f9' }}
                      itemStyle={{ color: '#a78bfa' }}
                    />
                    <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                      {(data.topicAverages).map((t, i) => (
                        <Cell key={i} fill={t.avg < 60 ? '#ef4444' : t.avg < 75 ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState msg="Complete quizzes to see performance" />}
            </div>
          </div>

          {/* Personalised recommendations */}
          <div className="card">
            <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span>💡</span> Personalised Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {weakTopics.slice(0, 3).length > 0 ? (
                weakTopics.slice(0, 3).map((t, i) => (
                  <Link key={i} href={`/quiz?topic=${encodeURIComponent(t.topic)}`}
                    className="bg-[#1a1a2e] hover:bg-[#1e2a4e] border border-[#1e3a5f] rounded-xl p-4 transition-all group">
                    <div className="text-red-400 text-xs mb-1 font-medium">Needs work</div>
                    <div className="text-slate-200 font-medium text-sm group-hover:text-violet-300 transition-colors">
                      {t.topic}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Current: {t.avg}% → Target: 80%</div>
                    <div className="text-xs text-violet-400 mt-2">Quiz now →</div>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center py-6">
                  <p className="text-slate-500 text-sm">Complete quizzes to get personalised recommendations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      {activeSection === 'timeline' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-slate-200 mb-1">Score Timeline</h2>
            <p className="text-xs text-slate-500 mb-4">Your last 10 quiz attempts</p>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid stroke="#1e3a5f" strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" tick={{ fill: '#94a3b8', fontSize: 12 }}
                    label={{ value: 'Attempt', position: 'insideBottom', fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#16213e', border: '1px solid #1e3a5f', borderRadius: 8 }}
                    labelStyle={{ color: '#f1f5f9' }}
                    itemStyle={{ color: '#a78bfa' }}
                    formatter={(v: any, name: any, props: { payload?: { topic?: string } }) => [
                      `${v}%`, props.payload?.topic ?? name ?? 'Score'
                    ]}
                  />
                  <Line type="monotone" dataKey="score"
                    stroke="#7c3aed" strokeWidth={2.5}
                    dot={{ fill: '#7c3aed', r: 5 }}
                    activeDot={{ r: 7, fill: '#a78bfa' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState msg="Complete quizzes to see your timeline" />}
          </div>

          {/* Quiz history table */}
          <div className="card">
            <h2 className="font-semibold text-slate-200 mb-4">Quiz History</h2>
            {data?.quizHistory && data.quizHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-[#1e3a5f]">
                      <th className="pb-2 font-medium">Topic</th>
                      <th className="pb-2 font-medium">Score</th>
                      <th className="pb-2 font-medium">Questions</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.quizHistory.map((q, i) => (
                      <tr key={i} className="border-b border-[#1e3a5f]/30 hover:bg-[#1a1a2e] transition-colors">
                        <td className="py-2.5 text-slate-300">{q.topic}</td>
                        <td className="py-2.5">
                          <span className={`font-medium ${
                            q.score >= 80 ? 'text-emerald-400' :
                            q.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>{q.score}%</span>
                        </td>
                        <td className="py-2.5 text-slate-400">{q.total}</td>
                        <td className="py-2.5 text-slate-500 text-xs">
                          {new Date(q.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No quiz history yet.</p>
            )}
          </div>
        </div>
      )}

      {/* HISTORY */}
      {activeSection === 'history' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span>📜</span> Learning Activity History
            </h2>
            <div className="space-y-3">
              {data?.activities && data.activities.length > 0 ? (
                data.activities.map((item, i) => {
                  const content = item.content.toLowerCase()
                  const isMistake = content.includes('mistake') || content.includes('error') || content.includes('failed')
                  const isQuiz = content.includes('quiz') || content.includes('session') || content.includes('completed')
                  
                  let type = isQuiz ? 'Quiz' : (isMistake ? 'Arena' : 'Activity')
                  let score = ''
                  let topic = ''
                  let date = item.metadata.timestamp ? new Date(parseInt(item.metadata.timestamp)).toLocaleDateString() : 'Recent'

                  // Try to extract topic
                  const topicMatch = item.content.match(/(?:completed|for|topic:|learned|about)\s+([^.]+?)(?:\s+quiz|\s+mistake|\s+session|\s+task|$)/i)
                  topic = item.metadata.problemTitle || item.metadata.topic || (topicMatch ? topicMatch[1] : 'Learning Item')

                  // Clean up topic (remove "the ")
                  if (topic.toLowerCase().startsWith('the ')) topic = topic.slice(4)

                  // Try to extract score
                  const scoreMatch = item.content.match(/score:\s*(\d+(?:\/\d+)?%?)/i)
                  if (item.metadata.score) {
                    score = `${item.metadata.score}%`
                  } else if (scoreMatch) {
                    score = scoreMatch[1]
                  } else if (isMistake) {
                    score = content.includes('code') ? 'Failed' : 'Mistake'
                  } else if (isQuiz) {
                    score = 'Completed'
                  }

                  return (
                    <div key={i} className="bg-[#1a1a2e] border border-[#1e3a5f]/50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          type === 'Quiz' ? 'bg-violet-900/30 text-violet-400' : 'bg-cyan-900/30 text-cyan-400'
                        }`}>
                          {type === 'Quiz' ? '📝' : '⚔️'}
                        </div>
                        <div>
                          <h3 className="text-slate-200 font-medium text-sm">{type}: {topic}</h3>
                          <p className="text-slate-500 text-xs">{date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`${
                          score === 'Failed' || score === 'Mistake' ? 'text-red-400' : 'text-violet-400'
                        } font-bold text-lg`}>
                          {score}
                        </div>
                        <div className="text-xs text-slate-500">Recorded in Hindsight</div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <p>No authentic hindsight data available yet.</p>
                  <p className="text-xs mt-1">Activities will appear here as you learn.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcDNAScore(data: DNAData | null): number {
  if (!data || data.topicAverages.length === 0) return 0
  const avg = data.topicAverages.reduce((s, t) => s + t.avg, 0) / data.topicAverages.length
  const streakBonus = Math.min(data.streak * 2, 10)
  return Math.min(Math.round(avg + streakBonus), 100)
}

function parseMistakePatterns(mistakes: string[]) {
  const text = mistakes.join(' ').toLowerCase()
  return {
    concept:  (text.match(/concept|wrong|incorrect|understand/g) ?? []).length,
    edgeCase: (text.match(/edge|boundary|empty|null|zero/g) ?? []).length,
    logic:    (text.match(/logic|reason|approach|algorithm/g) ?? []).length,
    time:     (text.match(/time|slow|timeout|fast/g) ?? []).length,
    silly:    (text.match(/silly|careless|typo|obvious/g) ?? []).length,
    code:     (text.match(/code|syntax|error|bug|compile/g) ?? []).length,
  }
}

function DNACard({ label, value, suffix = '', color, sub }: {
  label: string; value: number; suffix?: string; color: string; sub: string
}) {
  const colors: Record<string, string> = {
    violet: 'text-violet-400', red: 'text-red-400',
    emerald: 'text-emerald-400', amber: 'text-amber-400',
  }
  return (
    <div className="card">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}{suffix}</p>
      <p className="text-xs text-slate-500 mt-1">{sub}</p>
    </div>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="h-[280px] flex items-center justify-center">
      <p className="text-slate-500 text-sm">{msg}</p>
    </div>
  )
}

function LoadingDNA() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🧬</div>
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Analysing your learning DNA...</p>
      </div>
    </div>
  )
}