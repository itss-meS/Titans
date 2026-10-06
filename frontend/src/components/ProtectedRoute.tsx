import { Navigate, useLocation, useParams } from 'react-router-dom'
import { getRole, getStudentId, getSubject } from '../auth'
import type { Role } from '../types'

interface Props {
  roles: Role[]
  children: React.ReactNode
}

export default function ProtectedRoute({ roles, children }: Props) {
  const role = getRole()
  const studentId = getStudentId()
  const params = useParams()
  const location = useLocation()

  if (role === 'student' && !roles.includes('student') && studentId) {
    return <Navigate to={`/students/${studentId}`} replace />
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to="/login" replace />
  }

  if (role === 'student' && params.id && params.id !== studentId) {
    return <Navigate to={`/students/${studentId}`} replace />
  }

  if (role === 'teacher' && roles.includes('teacher') && location.pathname === '/teacher' && !getSubject()) {
    return <Navigate to="/teacher/subject" replace />
  }

  return <>{children}</>
}
