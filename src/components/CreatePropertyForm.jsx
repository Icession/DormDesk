import { useState } from 'react'
import { supabase } from '../lib/supabase'

const inputCls =
  'w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 mb-3'

export default function CreatePropertyForm({ ownerId, onCreated }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { data, error } = await supabase
      .from('properties')
      .insert({ owner_id: ownerId, name: name.trim(), address: address.trim() })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }
    onCreated(data) 
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-8 max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold text-slate-700 mb-1">Set up your property</h2>
      <p className="text-slate-500 mb-6">
        Create your boarding house first — rooms and tenants come right after.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          required placeholder="Property name (e.g. Sunshine Dormitory)"
          value={name} onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
        <input
          placeholder="Address (optional)"
          value={address} onChange={(e) => setAddress(e.target.value)}
          className={inputCls}
        />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="w-full bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg mt-1"
        >
          {submitting ? 'Creating…' : 'Create property'}
        </button>
      </form>
    </div>
  )
}