import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { session, profile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('owner')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session && profile) {
    return <Navigate to={profile.role === 'owner' ? '/owner' : '/tenant'} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }
    if (!data.session) {
      setError('Account created but no session — "Confirm email" is still ON in Supabase Auth settings. Turn it off (Step 1) and try a new email.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8 max-w-sm w-full">
        <h1 className="text-3xl font-bold text-slate-700 mb-1">Create your account</h1>
        <p className="text-slate-500 mb-6">Join DormDesk as an owner or tenant</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {['owner', 'tenant'].map((r) => (
              <button
                key={r} type="button" onClick={() => setRole(r)}
                className={`rounded-lg border-2 py-3 text-sm font-semibold transition-colors ${
                  role === r
                    ? 'border-slate-600 bg-slate-600 text-white'
                    : 'border-amber-200 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                {r === 'owner' ? 'Dorm Owner' : 'Tenant'}
              </button>
            ))}
          </div>

          <input
            type="text" required placeholder="Full name"
            value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 mb-3"
          />
          <input
            type="email" required placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 mb-3"
          />
          <input
            type="password" required minLength={6} placeholder="Password (min 6 characters)"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 mb-4"
          />

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <button
            type="submit" disabled={submitting}
            className="w-full bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg"
          >
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-slate-700 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}