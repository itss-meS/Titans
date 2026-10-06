import { Navigate, useParams } from 'react-router-dom'
import { getRole, getStudentId } from '../auth'
import type { Role } from '../types'

interface Props {
  roles: Role[]
  children: React.ReactNode
}

export default function ProtectedRoute({ roles, children }: Props) {
  const role = getRole()
  const studentId = getStudentId()
  const params = useParams()

  if (!role || !roles.includes(role)) {
    return <Navigate to="/login" replace />
  }

  if (role === 'student' && params.id && params.id !== studentId) {
    return <Navigate to={`/students/${studentId}`} replace />
  }

  return <>{children}</>
}
