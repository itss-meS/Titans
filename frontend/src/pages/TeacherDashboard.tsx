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
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'weakest' | 'critical' | 'name'>('weakest')
  const [filterConcept, setFilterConcept] = useState<string | null>(null)

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

  const totalStudents = data.students.length

  let filteredStudents = data.students.filter((student) => {
    const query = search.toLowerCase()
    const matchesSearch = student.name.toLowerCase().includes(query) || student.student_id.toLowerCase().includes(query)
    
    if (!matchesSearch) return false

    if (filterConcept) {
      const cell = student.cells.find(c => c.concept === filterConcept)
      if (!cell || (cell.severity !== 'critical' && cell.severity !== 'high')) {
        return false
      }
    }

    return true
  })

  if (sortBy === 'weakest') {
    filteredStudents = [...filteredStudents].sort((a, b) => a.overall_mastery - b.overall_mastery)
  } else if (sortBy === 'critical') {
    filteredStudents = [...filteredStudents].sort((a, b) => {
      const aCount = a.cells.filter(c => c.severity === 'critical' || c.severity === 'high').length
      const bCount = b.cells.filter(c => c.severity === 'critical' || c.severity === 'high').length
      return bCount - aCount
    })
  } else {
    filteredStudents = [...filteredStudents].sort((a, b) => a.name.localeCompare(b.name))
  }

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display text-ink">Student Mastery</h2>
          <span className="text-sm font-mono tracking-wider text-mute">
            {filteredStudents.length} of {totalStudents} students
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or id"
            aria-label="Search students"
            className="flex-1 px-4 py-2 border border-line rounded-xl bg-transparent text-ink font-sans placeholder:text-mute focus:border-accent transition-colors duration-200"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'weakest' | 'critical' | 'name')}
            className="px-4 py-2 border border-line rounded-xl bg-bg text-ink font-sans focus:border-accent transition-colors duration-200"
          >
            <option value="weakest">Weakest first</option>
            <option value="critical">Most critical gaps</option>
            <option value="name">Name A to Z</option>
          </select>
        </div>

        {filterConcept && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono tracking-wider text-mute">Filtering: {filterConcept}</span>
            <button
              onClick={() => setFilterConcept(null)}
              className="px-3 py-1 border border-accent rounded-full text-xs text-ink hover:bg-accentFaint transition-colors duration-150"
            >
              Remove
            </button>
          </div>
        )}

        <HeatmapTable
          concepts={data.concepts}
          students={filteredStudents}
          onSelect={(id) => navigate(`/students/${id}`)}
          filterConcept={filterConcept}
          onFilterConcept={setFilterConcept}
        />
      </div>
    </div>
  )
}
