import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errorMessage } from '../api'
import { setSubject } from '../auth'
import type { Subject } from '../types'

const FALLBACK_SUBJECT: Subject = {
  id: 'programming',
  name: 'Programming (CS101)',
  class_id: 1,
  concepts: ['Variables', 'Loops', 'Functions', 'Stack Frames', 'Recursion', 'Memoization', 'Dynamic Programming']
}

export default function SubjectSelect() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.get<Subject[]>('/subjects')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSubjects(res.data)
        } else {
          setSubjects([FALLBACK_SUBJECT])
        }
      })
      .catch((err) => {
        setError(errorMessage(err))
        setSubjects([FALLBACK_SUBJECT])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (id: string) => {
    setSubject(id)
    navigate('/teacher')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8">
        <div className="space-y-2 text-left">
          <h1 className="text-3xl font-display text-ink">Choose a subject</h1>
          <p className="text-sm text-mute">Select a subject to view class performance and learning gap analytics.</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-mute font-mono text-sm">Loading subjects...</div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-4 border border-line rounded-xl text-sm text-mute flex justify-between items-center">
                <span>Using fallback subject data.</span>
              </div>
            )}
            <div className="space-y-3">
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSelect(sub.id)}
                  className="w-full p-4 border border-line rounded-xl bg-surface hover:border-accent group flex items-center justify-between text-left transition-colors duration-200"
                >
                  <span className="font-medium text-ink group-hover:text-accent transition-colors duration-200">
                    {sub.name}
                  </span>
                  <span className="font-mono text-xs text-mute">
                    {sub.concepts?.length || 7} concepts
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
