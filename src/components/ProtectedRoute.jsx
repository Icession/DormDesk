import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <p className="text-slate-500">Loading…</p>
    </div>
  )
}

export default function ProtectedRoute({ allowedRole, children }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <FullPageLoader />

  if (allowedRole && profile.role !== allowedRole) {
    return <Navigate to={profile.role === 'owner' ? '/owner' : '/tenant'} replace />
  }

  return children
}