import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, profile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already (or just became) logged in → go to the right dashboard
  if (session && profile) {
    return <Navigate to={profile.role === 'owner' ? '/owner' : '/tenant'} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setSubmitting(false)
    }
    // On success: AuthContext updates → the <Navigate> above fires by itself
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8 max-w-sm w-full">
        <h1 className="text-3xl font-bold text-slate-700 mb-1">DormDesk</h1>
        <p className="text-slate-500 mb-6">Log in to your account</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email" required placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 mb-3"
          />
          <input
            type="password" required placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 mb-4"
          />

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <button
            type="submit" disabled={submitting}
            className="w-full bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          No account yet?{' '}
          <Link to="/signup" className="text-slate-700 font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}