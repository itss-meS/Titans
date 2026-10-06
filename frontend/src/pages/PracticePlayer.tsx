import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import api, { errorMessage } from '../api'
import { getRole, getStudentId } from '../auth'
import type { PracticeQOut, SubmitOut } from '../types'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import QuestionRenderer from '../components/QuestionRenderer'

interface QuestionState {
  answer: string
  submitted: boolean
  result: SubmitOut | null
  timeSpent: number
}

export default function PracticePlayer() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const role = getRole()
  const studentId = getStudentId()

  const [questions, setQuestions] = useState<PracticeQOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [states, setStates] = useState<QuestionState[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timer, setTimer] = useState(0)
  const timerRef = useRef<number | null>(null)

  const loadData = async () => {
    if (!setId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<PracticeQOut[]>(`/practice/${setId}`)
      setQuestions(res.data)
      setStates(
        res.data.map(() => ({
          answer: '',
          submitted: false,
          result: null,
          timeSpent: 0,
        }))
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [setId])

  useEffect(() => {
    setTimer(0)
    if (timerRef.current) clearInterval(timerRef.current)
    if (!finished && questions.length > 0 && !states[currentIndex]?.submitted) {
      timerRef.current = window.setInterval(() => {
        setTimer((t) => t + 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, finished, questions.length, states])

  const handleAnswerChange = (value: string) => {
    const newStates = [...states]
    newStates[currentIndex] = { ...newStates[currentIndex], answer: value }
    setStates(newStates)
  }

  const handleSubmit = async () => {
    if (!setId) return
    const state = states[currentIndex]
    const question = questions[currentIndex]
    if (submitting || state.submitted) return
    setSubmitError(null)
    setSubmitting(true)

    const newStates = [...states]
    newStates[currentIndex] = { ...state, timeSpent: timer }
    setStates(newStates)

    try {
      const res = await api.post<SubmitOut>(`/practice/${setId}/submit`, {
        question_id: question.id,
        answer: state.answer,
        time_spent: timer,
      })
      newStates[currentIndex] = {
        ...newStates[currentIndex],
        submitted: true,
        result: res.data,
      }
      setStates(newStates)
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setFinished(true)
    }
  }

  const handleBackToReport = () => {
    if (role === 'student') {
      navigate(`/students/${studentId}`)
    } else {
      navigate(-1)
    }
  }

  const handlePracticeAgain = () => {
    setCurrentIndex(0)
    setStates(
      questions.map(() => ({
        answer: '',
        submitted: false,
        result: null,
        timeSpent: 0,
      }))
    )
    setFinished(false)
    setSubmitError(null)
    setSubmitting(false)
  }

  if (loading) return <Loader label="Loading practice" />
  if (error) return <ErrorBox message={error} onRetry={loadData} />
  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-mute">No practice questions available</p>
        <button
          onClick={handleBackToReport}
          className="px-6 py-3 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
        >
          Back to Report
        </button>
      </div>
    )
  }

  if (finished) {
    const correctCount = states.filter((s) => s.result?.correct).length
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="space-y-4">
          <h1 className="text-4xl font-display text-ink">Practice Complete</h1>
          <p className="text-2xl font-display text-accent">
            {correctCount} of {questions.length} correct
          </p>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const state = states[i]
            const isCorrect = state.result?.correct
            return (
              <div key={i} className="flex items-center gap-3 border border-line rounded p-4 bg-bg">
                {isCorrect ? (
                  <Check size={20} className="text-accent flex-shrink-0" strokeWidth={2} />
                ) : (
                  <X size={20} className="text-accent flex-shrink-0" strokeWidth={2} />
                )}
                <div className="flex-1">
                  <p className="text-ink">
                    Question {i + 1}: {q.target_concept}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleBackToReport}
            className="px-6 py-3 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
          >
            Back to Report
          </button>
          <button
            onClick={handlePracticeAgain}
            className="px-6 py-3 border border-accent text-ink rounded-full font-medium hover:bg-accentFaint transition-colors duration-200"
          >
            Practice Again
          </button>
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  const state = states[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const minutes = Math.floor(timer / 60)
  const seconds = timer % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-mono tracking-wider text-mute">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <p className="text-sm font-mono tracking-wider text-ink">{timeDisplay}</p>
        </div>

        <div className="h-1 bg-line rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs font-mono tracking-wider bg-muteSoft text-ink">
            {question.target_concept}
          </span>
        </div>
      </div>

      <QuestionRenderer
        question={question}
        value={state.answer}
        onChange={handleAnswerChange}
        disabled={state.submitted}
      />

      {submitError && (
        <ErrorBox message={submitError} onRetry={handleSubmit} />
      )}

      {state.submitted && state.result && (
        <div
          className={`rounded p-6 border space-y-3 ${
            state.result.correct ? 'bg-accent text-onAccent' : 'border-accent bg-bg text-ink'
          }`}
        >
          <p className="text-lg font-medium">
            {state.result.correct ? 'Correct' : 'Not quite'}
          </p>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Correct answer:</span> {String(state.result.correct_answer)}
            </p>
            <p className="text-sm">{state.result.explanation}</p>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {!state.submitted && (
          <button
            onClick={handleSubmit}
            disabled={!state.answer.trim() || submitting}
            className="px-6 py-3 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200 disabled:bg-muteSoft disabled:text-mute disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        )}

        {state.submitted && (
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
          >
            {currentIndex < questions.length - 1 ? 'Next' : 'Finish'}
          </button>
        )}
      </div>
    </div>
  )
}
