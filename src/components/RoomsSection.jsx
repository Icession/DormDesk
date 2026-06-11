import { useState } from 'react'
import { supabase } from '../lib/supabase'

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

const inputCls =
  'rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500'

export default function RoomsSection({ propertyId, rooms, setRooms }) {
  const [name, setName] = useState('')
  const [rate, setRate] = useState('')
  const [capacity, setCapacity] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function addRoom(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        property_id: propertyId,
        name: name.trim(),
        monthly_rate: Number(rate),
        capacity: Number(capacity),
      })
      .select()
      .single()

    if (error) {
      setError(error.code === '23505' ? 'A room with that name already exists.' : error.message)
    } else {
      setRooms((prev) => [...prev, data])
      setName('')
      setRate('')
      setCapacity(1)
    }
    setSubmitting(false)
  }

  async function deleteRoom(room) {
    if (!window.confirm(`Delete ${room.name}? This can't be undone.`)) return
    const { error } = await supabase.from('rooms').delete().eq('id', room.id)
    if (error) {
      alert(error.message)
      return
    }
    setRooms((prev) => prev.filter((r) => r.id !== room.id))
  }

  const monthlyPotential = rooms.reduce((sum, r) => sum + Number(r.monthly_rate), 0)

  return (
    <div className="bg-white rounded-2xl shadow border border-amber-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-lg font-bold text-slate-700">Rooms ({rooms.length})</h2>
        {rooms.length > 0 && (
          <p className="text-sm text-slate-500">
            Income at full occupancy:{' '}
            <span className="font-semibold text-slate-700">{peso.format(monthlyPotential)}</span>/mo
          </p>
        )}
      </div>

      <form onSubmit={addRoom} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_auto] gap-3 mb-2">
        <input
          required placeholder="Room name (e.g. Room 101)"
          value={name} onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
        <input
          type="number" min="0" step="0.01" required placeholder="Rate (₱/mo)"
          value={rate} onChange={(e) => setRate(e.target.value)}
          className={inputCls}
        />
        <input
          type="number" min="1" required placeholder="Beds"
          value={capacity} onChange={(e) => setCapacity(e.target.value)}
          className={inputCls}
        />
        <button
          type="submit" disabled={submitting}
          className="bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          Add room
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {rooms.length === 0 ? (
        <p className="text-slate-500 text-sm mt-4">No rooms yet — add your first one above.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {rooms.map((room) => (
            <li key={room.id} className="relative border border-amber-200 rounded-xl p-4">
              <button
                onClick={() => deleteRoom(room)}
                title="Delete room"
                className="absolute top-2 right-3 text-slate-400 hover:text-red-500"
              >
                ✕
              </button>
              <p className="font-semibold text-slate-700">{room.name}</p>
              <p className="text-sm text-slate-500">{peso.format(room.monthly_rate)} / month</p>
              <p className="text-xs text-slate-400 mt-1">
                {room.capacity} bed{room.capacity > 1 ? 's' : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}