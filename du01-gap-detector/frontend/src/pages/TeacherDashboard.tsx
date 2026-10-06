import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { getSubject, setSubject } from '../auth'
import type { DashboardOut, Subject, GeneratedQuestion, GenerateOut, StudentOut } from '../types'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import HeatmapTable from '../components/HeatmapTable'
import TopGaps from '../components/TopGaps'

const FALLBACK_SUBJECT: Subject = {
  id: 'programming',
  name: 'Programming (CS101)',
  class_id: 1,
  concepts: ['Variables', 'Loops', 'Functions', 'Stack Frames', 'Recursion', 'Memoization', 'Dynamic Programming']
}

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [subjects, setSubjects] = useState<Subject[]>([FALLBACK_SUBJECT])
  const [currentSubjectId, setCurrentSubjectId] = useState<string>(() => getSubject() || 'programming')

  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [studentNameError, setStudentNameError] = useState<string | null>(null)
  const [addStudentLoading, setAddStudentLoading] = useState(false)
  const [addStudentApiError, setAddStudentApiError] = useState<string | null>(null)
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)

  const [generateOpen, setGenerateOpen] = useState(false)
  const [genConcept, setGenConcept] = useState('Variables')
  const [genCount, setGenCount] = useState(5)
  const [genDifficulty, setGenDifficulty] = useState(2)
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [genResults, setGenResults] = useState<GeneratedQuestion[]>([])
  const [selectedGenIndices, setSelectedGenIndices] = useState<Set<number>>(new Set())
  const [saveLoading, setSaveLoading] = useState(false)

  const addStudentBtnRef = useRef<HTMLButtonElement | null>(null)
  const firstStudentInputRef = useRef<HTMLInputElement | null>(null)
  const generateBtnRef = useRef<HTMLButtonElement | null>(null)
  const firstGenSelectRef = useRef<HTMLSelectElement | null>(null)

  const loadSubjects = async () => {
    try {
      const res = await api.get<Subject[]>('/subjects')
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSubjects(res.data)
      }
    } catch {
      setSubjects([FALLBACK_SUBJECT])
    }
  }

  const loadData = async (subjId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<DashboardOut>(`/classes/1/dashboard?subject=${encodeURIComponent(subjId)}`)
      setData(res.data)
      if (res.data.concepts && res.data.concepts.length > 0) {
        setGenConcept(res.data.concepts[0])
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    loadData(currentSubjectId)
  }, [currentSubjectId])

  const handleSubjectChange = (newSubj: string) => {
    setSubject(newSubj)
    setCurrentSubjectId(newSubj)
  }

  const openAddStudentModal = () => {
    setStudentName('')
    setStudentNameError(null)
    setAddStudentApiError(null)
    setAddStudentOpen(true)
    setTimeout(() => firstStudentInputRef.current?.focus(), 50)
  }

  const closeAddStudentModal = () => {
    setAddStudentOpen(false)
    addStudentBtnRef.current?.focus()
  }

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = studentName.trim()
    if (trimmed.length < 2 || trimmed.length > 60) {
      setStudentNameError('Full name must be between 2 and 60 characters.')
      return
    }
    setStudentNameError(null)
    setAddStudentApiError(null)
    setAddStudentLoading(true)

    try {
      const res = await api.post<StudentOut>('/students', { name: trimmed, class_id: 1 })
      closeAddStudentModal()
      setBannerMessage(`Added ${res.data.name} (${res.data.id})`)
      setTimeout(() => setBannerMessage(null), 5000)
      loadData(currentSubjectId)
    } catch (err) {
      setAddStudentApiError(errorMessage(err))
    } finally {
      setAddStudentLoading(false)
    }
  }

  const openGenerateModal = () => {
    setGenError(null)
    setGenResults([])
    setSelectedGenIndices(new Set())
    setGenerateOpen(true)
    setTimeout(() => firstGenSelectRef.current?.focus(), 50)
  }

  const closeGenerateModal = () => {
    setGenerateOpen(false)
    generateBtnRef.current?.focus()
  }

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenError(null)
    setGenLoading(true)
    setGenResults([])

    try {
      const res = await api.post<GenerateOut>(
        '/questions/generate',
        {
          subject: currentSubjectId,
          concept: genConcept,
          count: Number(genCount),
          difficulty: Number(genDifficulty)
        },
        { timeout: 60000 }
      )
      const qs = res.data.questions || []
      setGenResults(qs)
      setSelectedGenIndices(new Set(qs.map((_, i) => i)))
    } catch (err: any) {
      const status = err.response?.status
      const detail = err.response?.data?.detail
      if (status === 502 || status === 503 || (typeof detail === 'string' && detail.toLowerCase().includes('ai'))) {
        setGenError('Question generation is unavailable. Check that the AI key is set on the server.')
      } else {
        setGenError(errorMessage(err))
      }
    } finally {
      setGenLoading(false)
    }
  }

  const toggleGenIndex = (index: number) => {
    const copy = new Set(selectedGenIndices)
    if (copy.has(index)) {
      copy.delete(index)
    } else {
      copy.add(index)
    }
    setSelectedGenIndices(copy)
  }

  const handleSaveSelectedQuestions = async () => {
    const toSave = genResults.filter((_, idx) => selectedGenIndices.has(idx))
    if (toSave.length === 0) return

    setSaveLoading(true)
    setGenError(null)
    try {
      await api.post('/questions', toSave)
      setBannerMessage(`Saved ${toSave.length} questions`)
      setTimeout(() => setBannerMessage(null), 5000)
      closeGenerateModal()
    } catch (err) {
      setGenError(errorMessage(err))
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) return <Loader label="Loading dashboard" />
  if (error) return <ErrorBox message={error} onRetry={() => loadData(currentSubjectId)} />
  if (!data) return null

  const classAverage = data.students.length > 0
    ? Math.round((data.students.reduce((sum, s) => sum + (s.overall_mastery || 0), 0) / data.students.length) * 100)
    : 0

  const gapCount = data.top_gaps.length

  return (
    <div className="space-y-12 animate-fade-in">
      {bannerMessage && (
        <div className="p-4 border border-accent rounded-xl bg-surface text-ink font-mono text-sm">
          {bannerMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1
          className="font-display text-ink"
          style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: '1.1' }}
        >
          {data.class_name}
        </h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="subject-select" className="text-xs font-mono text-mute">
              Subject
            </label>
            <select
              id="subject-select"
              aria-label="Subject"
              value={currentSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="px-3 py-2 border border-line rounded-lg bg-bg text-ink font-mono text-xs focus:border-accent"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            ref={addStudentBtnRef}
            onClick={openAddStudentModal}
            className="px-4 py-2 border border-line rounded-lg text-sm text-ink hover:border-accent transition-colors duration-200"
          >
            Add student
          </button>

          <button
            ref={generateBtnRef}
            onClick={openGenerateModal}
            className="px-4 py-2 border border-line rounded-lg text-sm text-ink hover:border-accent transition-colors duration-200"
          >
            Generate questions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-line rounded-xl p-6 bg-bg space-y-2">
          <p className="text-xs font-mono tracking-wider text-mute">Students</p>
          <p className="text-3xl font-display text-ink">{data.students.length}</p>
        </div>
        <div className="border border-line rounded-xl p-6 bg-bg space-y-2">
          <p className="text-xs font-mono tracking-wider text-mute">Class Average</p>
          <p className="text-3xl font-display text-ink">{classAverage}%</p>
        </div>
        <div className="border border-line rounded-xl p-6 bg-bg space-y-2">
          <p className="text-xs font-mono tracking-wider text-mute">Class-Wide Gaps</p>
          <p className="text-3xl font-display text-ink">{gapCount}</p>
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

      {addStudentOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-student-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeAddStudentModal()
          }}
        >
          <div className="w-full max-w-md border border-line rounded-2xl p-6 bg-surface space-y-6 shadow-2xl">
            <h3 id="add-student-title" className="text-xl font-display text-ink">
              Add a student
            </h3>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-ink">Full name</label>
                <input
                  ref={firstStudentInputRef}
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg bg-bg text-ink focus:border-accent"
                  placeholder="e.g. Aarav Patil"
                />
                {studentNameError && (
                  <p className="text-xs font-mono text-accent">{studentNameError}</p>
                )}
              </div>

              {addStudentApiError && (
                <p className="text-xs font-mono text-accent">{addStudentApiError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddStudentModal}
                  className="px-4 py-2 border border-line rounded-lg text-sm text-ink hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStudentLoading}
                  className="px-4 py-2 bg-accent text-onAccent rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {addStudentLoading ? 'Adding...' : 'Add student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {generateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeGenerateModal()
          }}
        >
          <div className="w-full max-w-2xl border border-line rounded-2xl p-6 bg-surface space-y-6 shadow-2xl my-8">
            <h3 id="generate-title" className="text-xl font-display text-ink">
              Generate Questions
            </h3>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-mute">Concept</label>
                  <select
                    ref={firstGenSelectRef}
                    value={genConcept}
                    onChange={(e) => setGenConcept(e.target.value)}
                    className="w-full px-3 py-2 border border-line rounded-lg bg-bg text-ink text-sm"
                  >
                    {data.concepts.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-mute">How many</label>
                  <select
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-line rounded-lg bg-bg text-ink text-sm"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-mute">Difficulty</label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-line rounded-lg bg-bg text-ink text-sm"
                  >
                    <option value={1}>1 Easy</option>
                    <option value={2}>2 Medium</option>
                    <option value={3}>3 Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeGenerateModal}
                  className="px-4 py-2 border border-line rounded-lg text-sm text-ink hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="px-4 py-2 bg-accent text-onAccent rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {genLoading ? 'Writing questions...' : 'Generate'}
                </button>
              </div>
            </form>

            {genError && (
              <p className="text-xs font-mono text-accent p-3 border border-accent rounded-lg bg-bg">
                {genError}
              </p>
            )}

            {genResults.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-line">
                <h4 className="font-mono text-sm text-mute">Generated Preview ({genResults.length})</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {genResults.map((q, idx) => (
                    <div key={idx} className="p-4 border border-line rounded-xl bg-bg space-y-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedGenIndices.has(idx)}
                          onChange={() => toggleGenIndex(idx)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-ink">{q.stem}</p>
                          {q.type === 'mcq' && q.options && (
                            <div className="grid grid-cols-2 gap-1 text-xs text-mute pt-1">
                              {q.options.map((opt, oi) => (
                                <span key={oi} className={opt === q.correct_answer ? 'text-accent font-medium' : ''}>
                                  • {opt} {opt === q.correct_answer && '(correct)'}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs font-mono text-mute uppercase">{q.type}</span>
                            <span className="text-xs font-mono text-mute">Diff: {q.difficulty}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleSaveSelectedQuestions}
                    disabled={selectedGenIndices.size === 0 || saveLoading}
                    className="px-6 py-2 bg-accent text-onAccent rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {saveLoading ? 'Saving...' : `Save selected (${selectedGenIndices.size})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
