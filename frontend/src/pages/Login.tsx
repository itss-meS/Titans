import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getRole, homePath } from '../auth'

const students = [
  { id: 'stu_1', name: 'Aarav Patil' },
  { id: 'stu_2', name: 'Diya Kulkarni' },
  { id: 'stu_3', name: 'Kabir Shaikh' },
  { id: 'stu_4', name: 'Ishaan Jadhav' },
  { id: 'stu_5', name: 'Ananya Pawar' },
  { id: 'stu_6', name: 'Rohan Chavan' },
  { id: 'stu_7', name: 'Sanika More' },
  { id: 'stu_8', name: 'Vedant Kale' },
  { id: 'stu_9', name: 'Meera Joshi' },
  { id: 'stu_10', name: 'Arjun Nair' },
  { id: 'stu_11', name: 'Prisha Gupta' },
  { id: 'stu_12', name: 'Atharv Bhosale' },
  { id: 'stu_13', name: 'Tanvi Deshpande' },
  { id: 'stu_14', name: 'Yash Sawant' },
  { id: 'stu_15', name: 'Riya Mehta' },
  { id: 'stu_16', name: 'Omkar Salunkhe' },
  { id: 'stu_17', name: 'Kavya Iyer' },
  { id: 'stu_18', name: 'Harsh Agarwal' },
  { id: 'stu_19', name: 'Neha Kamble' },
  { id: 'stu_20', name: 'Siddharth Rao' },
  { id: 'stu_21', name: 'Aditi Shinde' },
  { id: 'stu_22', name: 'Pranav Lokhande' },
  { id: 'stu_23', name: 'Shruti Gaikwad' },
  { id: 'stu_24', name: 'Rahul Yadav' },
  { id: 'stu_25', name: 'Ishita Verma' },
  { id: 'stu_26', name: 'Mihir Patel' },
  { id: 'stu_27', name: 'Pooja Waghmare' },
  { id: 'stu_28', name: 'Aryan Singh' },
  { id: 'stu_29', name: 'Trisha Dey' },
  { id: 'stu_30', name: 'Soham Thorat' },
]

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const role = getRole()
    if (role) {
      navigate(homePath(), { replace: true })
    }
  }, [navigate])

  const handleTeacherLogin = () => {
    login('teacher', '')
    navigate('/teacher/subject')
  }

  const handleStudentLogin = () => {
    const trimmed = username.trim()
    
    if (!trimmed) {
      setErrorMessage('No student found with that username')
      return
    }

    const query = trimmed.toLowerCase()
    
    let match = students.find(s => s.id.toLowerCase() === query || s.name.toLowerCase() === query)
    
    if (!match) {
      const firstNameMatches = students.filter(s => {
        const firstName = s.name.split(' ')[0].toLowerCase()
        return firstName === query
      })
      
      if (firstNameMatches.length === 1) {
        match = firstNameMatches[0]
      }
    }

    if (match) {
      login('student', match.id)
      navigate(`/students/${match.id}`)
    } else {
      setErrorMessage('No student found with that username')
    }
  }

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleStudentLogin()
    }
  }

  const hasError = errorMessage !== ''

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

        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-sm font-mono tracking-wider text-mute">Teacher</h2>
            <button
              onClick={handleTeacherLogin}
              className="px-6 py-3 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
            >
              Login as Teacher
            </button>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-mono tracking-wider text-mute">Student</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Username"
                aria-label="Username"
                aria-invalid={hasError}
                aria-describedby={hasError ? 'student-error' : undefined}
                autoComplete="off"
                className="flex-1 px-4 py-3 border border-line rounded-xl bg-transparent text-ink font-sans placeholder:text-mute focus:border-accent transition-colors duration-200"
              />
              <button
                onClick={handleStudentLogin}
                className="px-6 py-3 bg-accent text-onAccent rounded-full font-medium hover:opacity-90 transition-opacity duration-200"
              >
                Login as Student
              </button>
            </div>
            {hasError && (
              <p id="student-error" className="text-xs font-mono tracking-wider text-accent">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
