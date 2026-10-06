import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { getRole } from '../auth'
import type { ReportOut } from '../types'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import MasteryRadar from '../components/MasteryRadar'
import GapCard from '../components/GapCard'
import RecommendationList from '../components/RecommendationList'

export default function StudentReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const role = getRole()
  const [data, setData] = useState<ReportOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!id) return

    setData(null)
    setLoading(true)
    setError(null)

    api.get<ReportOut>(`/students/${id}/report`)
      .then((res) => {
        if (active) {
          setData(res.data)
        }
      })
      .catch((err) => {
        if (active) {
          setError(errorMessage(err))
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loader label="Loading report" />
  if (error) return <ErrorBox message={error} onRetry={() => {
    if (id) {
      setLoading(true)
      setError(null)
      api.get<ReportOut>(`/students/${id}/report`)
        .then((res) => setData(res.data))
        .catch((err) => setError(errorMessage(err)))
        .finally(() => setLoading(false))
    }
  }} />
  if (!data) return null

  const overallMastery = Math.round((data.overall_mastery || 0) * 100)
  const practiceCount = data.practice_set ? data.practice_set.length : 0
  const topThreeGaps = data.gaps ? data.gaps.slice(0, 3) : []

  const statusBanner = (() => {
    if (data.status === 'no_data') {
      return (
        <div className="border border-line rounded p-4 bg-muteSoft text-ink">
          {data.message || 'No response data available yet.'}
        </div>
      )
    }
    if (data.status === 'low_confidence') {
      return (
        <div className="border border-accent rounded p-4 bg-bg text-ink">
          {data.message || 'More data needed for high confidence.'}
        </div>
      )
    }
    if (data.status === 'ok' && data.message) {
      return (
        <div
          className="rounded p-4 border text-ink"
          style={{
            background: 'var(--glass-bg)',
            borderColor: 'var(--glass-border)',
            backdropFilter: 'blur(18px) saturate(140%)',
          }}
        >
          {data.message}
        </div>
      )
    }
    return null
  })()

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-display text-ink">{data.student_name}</h1>
          <p
            className="font-display text-accent"
            style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: '1' }}
          >
            {overallMastery}%
          </p>
          <p className="text-sm font-mono tracking-wider text-mute">Overall Mastery</p>
        </div>

        {statusBanner}
      </div>

      <div className="space-y-4 border border-line rounded-xl p-6 bg-surface">
        <h2 className="text-xl font-display text-ink">1. Do this next</h2>
        <RecommendationList items={data.recommendations ? data.recommendations.slice(0, 2) : []} />
      </div>

      {topThreeGaps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display text-ink">2. Top three focus areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThreeGaps.map((gap, idx) => (
              <div key={idx} className="border border-line rounded-xl p-4 bg-bg space-y-2">
                <p className="font-medium text-ink">{gap.concept}</p>
                <p className="text-xs font-mono text-accent capitalize">Severity: {gap.severity}</p>
                <p className="text-xs text-mute">Mastery: {Math.round(gap.mastery * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-display text-ink">3. Mastery Radar</h2>
            <MasteryRadar data={data.mastery_by_concept || []} />
          </div>

          {data.strengths && data.strengths.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-display text-ink">4. Strengths</h3>
              <div className="flex flex-wrap gap-2">
                {data.strengths.map((strength) => (
                  <span
                    key={strength}
                    className="px-3 py-1 rounded-full text-sm bg-muteSoft text-ink"
                  >
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display text-ink">5. Details & Learning Gaps</h2>
          {!data.gaps || data.gaps.length === 0 ? (
            <div className="border border-line rounded p-6 bg-bg">
              <p className="text-ink">No significant learning gaps detected.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.gaps.map((gap, i) => (
                <GapCard key={i} gap={gap} />
              ))}
            </div>
          )}
        </div>
      </div>

      {role !== 'teacher' && (
        <>
          {data.practice_set_id ? (
            <div className="flex justify-center">
              <button
                onClick={() => navigate(`/practice/${data.practice_set_id}`)}
                className="px-8 py-4 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
              >
                Start Practice ({practiceCount} {practiceCount === 1 ? 'question' : 'questions'})
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                disabled
                className="px-8 py-4 bg-muteSoft text-mute rounded-full font-medium cursor-not-allowed"
                title="No practice set available"
              >
                Start Practice
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
