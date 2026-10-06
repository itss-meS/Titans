import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { setSubject } from '../auth'
import type { Subject } from '../types'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'

const fallbackSubjects: Subject[] = [
  { id: 'programming', name: 'Programming (CS101)', class_id: 1, concepts: [] },
]

export default function SubjectSelect() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Subject[]>('/subjects')
      .then((response) => setSubjects(response.data))
      .catch((err) => {
        if (err.response?.status === 404 || !err.response) {
          setSubjects(fallbackSubjects)
        } else {
          setError(errorMessage(err))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader label="Loading subjects" />
  if (error) return <ErrorBox message={error} onRetry={() => window.location.reload()} />

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div className="space-y-3">
        <h1 className="font-display text-ink" style={{ fontSize: 'clamp(48px, 8vw, 88px)', lineHeight: '1' }}>
          Choose a subject
        </h1>
        <p className="text-mute">Select a subject to open its class dashboard.</p>
      </div>
      <div className="space-y-2">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => {
              setSubject(subject.id)
              navigate('/teacher')
            }}
            className="group w-full flex items-center justify-between border border-line px-5 py-4 text-left text-ink hover:border-accent focus:border-accent focus:outline-none transition-colors"
          >
            <span className="group-hover:text-accent group-focus:text-accent">{subject.name}</span>
            <span className="font-mono text-xs text-mute">{subject.concepts.length} concepts</span>
          </button>
        ))}
      </div>
    </div>
  )
}
