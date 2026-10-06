import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import api, { errorMessage } from '../api'
import { getSubject, setSubject } from '../auth'
import type { DashboardOut, GeneratedQuestion, GenerateOut, Subject } from '../types'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import HeatmapTable from '../components/HeatmapTable'
import TopGaps from '../components/TopGaps'

const fallbackSubjects: Subject[] = [{ id: 'programming', name: 'Programming (CS101)', class_id: 1, concepts: [] }]
type Modal = 'student' | 'questions' | null

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>(fallbackSubjects)
  const [subjectId, setSubjectId] = useState(getSubject() || fallbackSubjects[0].id)
  const [data, setData] = useState<DashboardOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'weakest' | 'critical' | 'name'>('weakest')
  const [filterConcept, setFilterConcept] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [concept, setConcept] = useState('')
  const [count, setCount] = useState(3)
  const [difficulty, setDifficulty] = useState(1)
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const openingButton = useRef<HTMLButtonElement | null>(null)
  const firstField = useRef<HTMLInputElement | HTMLSelectElement | null>(null)

  const loadSubjects = async () => {
    try {
      const response = await api.get<Subject[]>('/subjects')
      setSubjects(response.data.length ? response.data : fallbackSubjects)
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 404 || !err.response)) setSubjects(fallbackSubjects)
      else setModalError(errorMessage(err))
    }
  }

  const loadData = async (classId: number, id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<DashboardOut>(`/classes/${classId}/dashboard?subject=${encodeURIComponent(id)}`)
      setData(response.data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSubjects()
    void loadData(subjects.find((item) => item.id === subjectId)?.class_id || 1, subjectId)
  }, [])

  useEffect(() => {
    if (!modal) return
    const timer = window.setTimeout(() => firstField.current?.focus(), 0)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [modal])

  const closeModal = () => {
    setModal(null)
    setModalError(null)
    openingButton.current?.focus()
  }

  const changeSubject = (id: string) => {
    const next = subjects.find((item) => item.id === id) || fallbackSubjects[0]
    setSubjectId(id)
    setSubject(id)
    setSearch('')
    setSortBy('weakest')
    setFilterConcept(null)
    void loadData(next.class_id, id)
  }

  const addStudent = async () => {
    const trimmed = name.trim()
    if (trimmed.length < 2 || trimmed.length > 60) {
      setNameError('Enter a name from 2 to 60 characters.')
      return
    }
    setBusy(true)
    setModalError(null)
    try {
      const response = await api.post<{ id: string; name: string; class_id: number }>('/students', { name: trimmed, class_id: data?.class_id || 1 })
      closeModal()
      setName('')
      setStatus(`Added ${trimmed} (${response.data.id})`)
      window.setTimeout(() => setStatus(null), 5000)
      if (data) void loadData(data.class_id, subjectId)
    } catch (err) {
      setModalError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const generateQuestions = async () => {
    if (!concept) return
    setBusy(true)
    setModalError(null)
    try {
      const response = await api.post<GenerateOut>('/questions/generate', { subject: subjectId, concept, count, difficulty }, { timeout: 60000 })
      setGenerated(response.data.questions)
      setSelected(Object.fromEntries(response.data.questions.map((question) => [question.id, true])))
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined
      if ((axios.isAxiosError(err) && [502, 503].includes(err.response?.status || 0)) || String(detail).toLowerCase().includes('ai')) {
        setModalError('Question generation is unavailable. Check that the AI key is set on the server.')
      } else {
        setModalError(errorMessage(err))
      }
    } finally {
      setBusy(false)
    }
  }

  const saveQuestions = async () => {
    const questions = generated.filter((question) => selected[question.id])
    if (!questions.length) return
    setBusy(true)
    try {
      await api.post('/questions', questions)
      setStatus(`Saved ${questions.length} questions`)
      closeModal()
      setGenerated([])
      window.setTimeout(() => setStatus(null), 5000)
      if (data) void loadData(data.class_id, subjectId)
    } catch (err) {
      setModalError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loader label="Loading dashboard" />
  if (error) return <ErrorBox message={error} onRetry={() => data && loadData(data.class_id, subjectId)} />
  if (!data) return null

  const currentSubject = subjects.find((item) => item.id === subjectId)
  const concepts = currentSubject?.concepts.length ? currentSubject.concepts : data.concepts
  const selectedConcept = concept || concepts[0] || ''
  const students = [...data.students].filter((student) => {
    const query = search.toLowerCase()
    return student.name.toLowerCase().includes(query) || student.student_id.toLowerCase().includes(query)
  }).filter((student) => {
    if (!filterConcept) return true
    const cell = student.cells.find((item) => item.concept === filterConcept)
    return Boolean(cell && ['critical', 'high'].includes(cell.severity))
  }).sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : sortBy === 'critical' ? b.cells.filter((cell) => ['critical', 'high'].includes(cell.severity)).length - a.cells.filter((cell) => ['critical', 'high'].includes(cell.severity)).length : a.overall_mastery - b.overall_mastery)
  const gaps = data.top_gaps.filter((gap) => concepts.includes(gap.concept))

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="space-y-6">
        <h1 className="font-display text-ink" style={{ fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: '1.1' }}>{data.class_name}</h1>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-2">
            <span className="block text-xs font-mono tracking-wider text-mute">Subject</span>
            <select aria-label="Subject" value={subjectId} onChange={(event) => changeSubject(event.target.value)} className="px-4 py-2 border border-line rounded bg-bg text-ink">
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </label>
          <button ref={modal === 'student' ? openingButton : undefined} onClick={(event) => { openingButton.current = event.currentTarget; setModal('student') }} className="px-4 py-2 border border-line rounded text-ink hover:border-accent">Add student</button>
          <button ref={modal === 'questions' ? openingButton : undefined} onClick={(event) => { openingButton.current = event.currentTarget; setModal('questions'); setConcept(concepts[0] || '') }} className="px-4 py-2 border border-line rounded text-ink hover:border-accent">Generate questions</button>
        </div>
        {status && <p className="text-sm text-accent" role="status">{status}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-line rounded p-6 bg-bg space-y-2"><p className="text-xs font-mono tracking-wider text-mute">Students</p><p className="text-3xl font-display text-ink">{data.students.length}</p></div>
          <div className="border border-line rounded p-6 bg-bg space-y-2"><p className="text-xs font-mono tracking-wider text-mute">Class Average</p><p className="text-3xl font-display text-ink">{Math.round(data.students.reduce((sum, student) => sum + student.overall_mastery, 0) / Math.max(data.students.length, 1) * 100)}%</p></div>
          <div className="border border-line rounded p-6 bg-bg space-y-2"><p className="text-xs font-mono tracking-wider text-mute">Class-Wide Gaps</p><p className="text-3xl font-display text-ink">{gaps.length}</p></div>
        </div>
      </div>
      <div className="space-y-4"><h2 className="text-2xl font-display text-ink">Top Gaps</h2><TopGaps items={gaps} /></div>
      <div className="space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-2xl font-display text-ink">Student Mastery</h2><span className="text-sm font-mono text-mute">{students.length} of {data.students.length} students</span></div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or id" aria-label="Search students" className="flex-1 px-4 py-2 border border-line rounded bg-transparent text-ink" />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'weakest' | 'critical' | 'name')} className="px-4 py-2 border border-line rounded bg-bg text-ink"><option value="weakest">Weakest first</option><option value="critical">Most critical gaps</option><option value="name">Name A to Z</option></select>
        </div>
        {filterConcept && <button onClick={() => setFilterConcept(null)} className="text-sm text-accent underline">Filtering: {filterConcept} — Remove</button>}
        <HeatmapTable concepts={concepts} students={students} onSelect={(id) => navigate(`/students/${id}`)} filterConcept={filterConcept} onFilterConcept={setFilterConcept} />
      </div>
      {modal && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal() }}>
        <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-line rounded-2xl p-6 bg-surface space-y-6">
          <h2 id="modal-title" className="text-2xl font-display text-ink">{modal === 'student' ? 'Add a student' : 'Generate questions'}</h2>
          {modal === 'student' && <div className="space-y-4">
            <label className="block space-y-2"><span className="text-sm text-ink">Full name</span><input ref={(element) => { firstField.current = element }} value={name} onChange={(event) => { setName(event.target.value); setNameError(null) }} className="w-full px-4 py-3 border border-line rounded bg-transparent text-ink" /></label>
            {nameError && <p className="text-sm font-mono text-accent">{nameError}</p>}
            {modalError && <p className="text-sm text-accent">{modalError}</p>}
            <div className="flex gap-3"><button onClick={closeModal} className="px-5 py-3 border border-line rounded text-ink">Cancel</button><button onClick={() => void addStudent()} disabled={busy} className="px-5 py-3 bg-accent text-onAccent rounded-full">{busy ? 'Adding student' : 'Add student'}</button></div>
          </div>}
          {modal === 'questions' && <div className="space-y-4">
            <label className="block space-y-2"><span className="text-sm text-ink">Concept</span><select ref={(element) => { firstField.current = element }} value={selectedConcept} onChange={(event) => setConcept(event.target.value)} className="w-full px-4 py-3 border border-line rounded bg-bg text-ink">{concepts.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3"><label className="space-y-2"><span className="block text-sm text-ink">How many</span><select value={count} onChange={(event) => setCount(Number(event.target.value))} className="w-full px-4 py-3 border border-line rounded bg-bg text-ink"><option value={3}>3</option><option value={5}>5</option><option value={8}>8</option></select></label><label className="space-y-2"><span className="block text-sm text-ink">Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(Number(event.target.value))} className="w-full px-4 py-3 border border-line rounded bg-bg text-ink"><option value={1}>1 Easy</option><option value={2}>2 Medium</option><option value={3}>3 Hard</option></select></label></div>
            <button onClick={() => void generateQuestions()} disabled={busy} className="px-5 py-3 bg-accent text-onAccent rounded-full">{busy ? 'Writing questions' : 'Generate'}</button>
            {modalError && <p className="text-sm text-accent">{modalError}</p>}
            {generated.map((question) => <label key={question.id} className="block border border-line rounded p-4 space-y-2"><span className="flex gap-3"><input type="checkbox" checked={Boolean(selected[question.id])} onChange={(event) => setSelected((value) => ({ ...value, [question.id]: event.target.checked }))} /><span className="text-ink">{question.stem}</span></span><span className="block text-sm text-mute">{question.type} · difficulty {question.difficulty}</span>{question.options.map((option) => <span key={option} className="block pl-7 text-sm text-mute">{option}{option === question.correct_answer ? ' correct' : ''}</span>)}</label>)}
            <div className="flex gap-3"><button onClick={closeModal} className="px-5 py-3 border border-line rounded text-ink">Cancel</button><button onClick={() => void saveQuestions()} disabled={busy || !generated.some((question) => selected[question.id])} className="px-5 py-3 bg-accent text-onAccent rounded-full">Save selected ({generated.filter((question) => selected[question.id]).length})</button></div>
          </div>}
        </div>
      </div>}
    </div>
  )
}
