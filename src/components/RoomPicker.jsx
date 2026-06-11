import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

export default function RoomPicker({ currentRoomId, onRequested }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_rooms_with_availability')
      if (error) console.error('Rooms load failed:', error.message)
      setRooms(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function requestRoom(room) {
    setError('')
    setBusyId(room.id)
    const { error } = await supabase.rpc('request_room', { p_room_id: room.id })
    if (error) setError(error.message)
    else onRequested()
    setBusyId(null)
  }

  if (loading) return <p className="text-slate-500 text-sm text-center">Loading rooms…</p>
  if (rooms.length === 0)
    return <p className="text-slate-500 text-sm text-center">The owner hasn't added rooms yet.</p>

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3 text-center">{error}</p>}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {rooms.map((room) => {
          const bedsLeft = room.capacity - Number(room.occupied)
          const full = bedsLeft <= 0
          const isCurrent = room.id === currentRoomId
          return (
            <li
              key={room.id}
              className={`border rounded-xl p-4 ${
                isCurrent ? 'border-slate-500 bg-slate-50' : 'border-amber-200'
              }`}
            >
              <p className="font-semibold text-slate-700">{room.name}</p>
              <p className="text-sm text-slate-500">{peso.format(room.monthly_rate)} / month</p>
              <p className="text-xs text-slate-400 mb-3">
                {full ? 'Full' : `${bedsLeft} bed${bedsLeft > 1 ? 's' : ''} left`}
              </p>
              <button
                disabled={full || isCurrent || busyId === room.id}
                onClick={() => requestRoom(room)}
                className="w-full bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg"
              >
                {isCurrent ? 'Requested ✓' : full ? 'Full' : 'Request this room'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}