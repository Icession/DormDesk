import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import OwnerDashboard from './pages/OwnerDashboard'
import TenantDashboard from './pages/TenantDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function HomeRedirect() {
  const { session, profile, loading } = useAuth()
  if (loading || (session && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="text-slate-500">Loading…</p>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={profile.role === 'owner' ? '/owner' : '/tenant'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRole="owner">
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenant"
        element={
          <ProtectedRoute allowedRole="tenant">
            <TenantDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}