import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getRole, homePath } from '../auth'

export default function Login() {
  const navigate = useNavigate()
  const [selectedStudent, setSelectedStudent] = useState('stu_1')

  useEffect(() => {
    const role = getRole()
    if (role) {
      navigate(homePath(), { replace: true })
    }
  }, [navigate])

  const handleTeacherLogin = () => {
    login('teacher', '')
    navigate('/teacher')
  }

  const handleStudentLogin = () => {
    login('student', selectedStudent)
    navigate(`/students/${selectedStudent}`)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-12">
        <div className="space-y-4">
          <h1
            className="font-display text-ink"
            style={{ fontSize: 'clamp(40px, 8vw, 96px)', lineHeight: '1.1' }}
          >
            Learning Gap Detector
          </h1>
          <p className="text-lg text-mute max-w-xl">
            Identify learning gaps with precision. Accelerate mastery.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-mono tracking-wider text-mute">Teacher Access</h2>
            <button
              onClick={handleTeacherLogin}
              className="px-6 py-3 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
            >
              Login as Teacher
            </button>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-mono tracking-wider text-mute">Student Access</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="flex-1 px-4 py-3 border border-line rounded-full bg-bg text-ink focus:border-accent transition-colors duration-200"
              >
                <option value="stu_1">stu_1 — Aarav</option>
                <option value="stu_2">stu_2 — Diya</option>
                <option value="stu_3">stu_3 — Kabir</option>
              </select>
              <button
                onClick={handleStudentLogin}
                className="px-6 py-3 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
              >
                Login as Student
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
