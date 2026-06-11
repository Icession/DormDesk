import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function JoinPropertyForm({ onJoined }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await supabase.rpc('join_property', { p_invite_code: code.trim() })

    if (error) {
      setError(error.message) // "Invalid invite code" comes straight from the RPC
      setSubmitting(false)
      return
    }
    onJoined()
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8 max-w-sm mx-auto mt-10">
      <h2 className="text-2xl font-bold text-slate-700 mb-1">Join your boarding house</h2>
      <p className="text-slate-500 mb-6">
        Ask your dorm owner for the 8-character invite code.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          required maxLength={8} placeholder="ABC12345"
          value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-3 text-slate-700 font-mono text-xl text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-slate-500 mb-4"
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="w-full bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg"
        >
          {submitting ? 'Joining…' : 'Join property'}
        </button>
      </form>
    </div>
  )
}