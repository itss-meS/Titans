import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import type { DashboardOut } from '../types'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import HeatmapTable from '../components/HeatmapTable'
import TopGaps from '../components/TopGaps'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<DashboardOut>('/classes/1/dashboard')
      setData(res.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) return <Loader label="Loading dashboard" />
  if (error) return <ErrorBox message={error} onRetry={loadData} />
  if (!data) return null

  const classAverage = data.students.length > 0
    ? Math.round((data.students.reduce((sum, s) => sum + s.overall_mastery, 0) / data.students.length) * 100)
    : 0

  const gapCount = data.top_gaps.length

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="space-y-6">
        <h1
          className="font-display text-ink"
          style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: '1.1' }}
        >
          {data.class_name}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-line rounded p-6 bg-bg space-y-2">
            <p className="text-xs font-mono tracking-wider text-mute">Students</p>
            <p className="text-3xl font-display text-ink">{data.students.length}</p>
          </div>
          <div className="border border-line rounded p-6 bg-bg space-y-2">
            <p className="text-xs font-mono tracking-wider text-mute">Class Average</p>
            <p className="text-3xl font-display text-ink">{classAverage}%</p>
          </div>
          <div className="border border-line rounded p-6 bg-bg space-y-2">
            <p className="text-xs font-mono tracking-wider text-mute">Class-Wide Gaps</p>
            <p className="text-3xl font-display text-ink">{gapCount}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-display text-ink">Top Gaps</h2>
        <TopGaps items={data.top_gaps} />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-display text-ink">Student Mastery</h2>
        <HeatmapTable
          concepts={data.concepts}
          students={data.students}
          onSelect={(id) => navigate(`/students/${id}`)}
        />
      </div>
    </div>
  )
}
