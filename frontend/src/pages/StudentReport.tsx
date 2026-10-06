import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import type { ReportOut } from '../types'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import MasteryRadar from '../components/MasteryRadar'
import GapCard from '../components/GapCard'
import RecommendationList from '../components/RecommendationList'

export default function StudentReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ReportOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ReportOut>(`/students/${id}/report`)
      setData(res.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) return <Loader label="Loading report" />
  if (error) return <ErrorBox message={error} onRetry={loadData} />
  if (!data) return null

  const overallMastery = Math.round(data.overall_mastery * 100)
  const practiceCount = data.practice_set.length

  const statusBanner = (() => {
    if (data.status === 'no_data') {
      return (
        <div className="border border-line rounded p-4 bg-muteSoft text-ink">
          {data.message}
        </div>
      )
    }
    if (data.status === 'low_confidence') {
      return (
        <div className="border border-accent rounded p-4 bg-bg text-ink">
          {data.message}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-display text-ink">Mastery Overview</h2>
            <MasteryRadar data={data.mastery_by_concept} />
          </div>

          {data.strengths.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-display text-ink">Strengths</h3>
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
          <h2 className="text-2xl font-display text-ink">Learning Gaps</h2>
          {data.gaps.length === 0 ? (
            <div className="border border-line rounded p-6 bg-bg">
              <p className="text-ink">No significant gaps detected</p>
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

      <div className="space-y-4">
        <h2 className="text-2xl font-display text-ink">Recommendations</h2>
        <RecommendationList items={data.recommendations} />
      </div>

      {data.practice_set_id && (
        <div className="flex justify-center">
          <button
            onClick={() => navigate(`/practice/${data.practice_set_id}`)}
            className="px-8 py-4 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
          >
            Start Practice ({practiceCount} {practiceCount === 1 ? 'question' : 'questions'})
          </button>
        </div>
      )}

      {!data.practice_set_id && (
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
    </div>
  )
}
