import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TENANCY_SELECT = '*, profiles(full_name, phone), rooms(name)'

export default function TenantsSection({ propertyId, rooms }) {
  const [tenancies, setTenancies] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState({}) // { [tenancyId]: roomId }

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('tenancies')
        .select(TENANCY_SELECT)
        .eq('property_id', propertyId)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: true })

      if (error) console.error('Tenants load failed:', error.message)
      setTenancies(data ?? [])
      setLoading(false)
    }
    load()
  }, [propertyId])

  const pending = tenancies.filter((t) => t.status === 'pending')
  const active = tenancies.filter((t) => t.status === 'active')

  // Beds in use per room (active tenancies only)
  const occupancy = {}
  for (const t of active) {
    if (t.room_id) occupancy[t.room_id] = (occupancy[t.room_id] ?? 0) + 1
  }

  async function assignRoom(tenancy) {
    const roomId = selectedRoom[tenancy.id] ?? tenancy.room_id
    if (!roomId) {
      alert('Pick a room first.')
      return
    }
    setBusyId(tenancy.id)

    const { data, error } = await supabase
      .from('tenancies')
      .update({
        room_id: roomId,
        status: 'active',
        start_date: new Date().toISOString().slice(0, 10),
      })
      .eq('id', tenancy.id)
      .select(TENANCY_SELECT)
      .single()

    if (error) alert(error.message)
    else setTenancies((prev) => prev.map((t) => (t.id === tenancy.id ? data : t)))
    setBusyId(null)
  }

  async function endTenancy(tenancy, verb) {
    if (!window.confirm(`${verb} ${tenancy.profiles?.full_name}?`)) return
    setBusyId(tenancy.id)

    const { error } = await supabase
      .from('tenancies')
      .update({ status: 'ended' })
      .eq('id', tenancy.id)

    if (error) alert(error.message)
    else setTenancies((prev) => prev.filter((t) => t.id !== tenancy.id))
    setBusyId(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-amber-200 p-6">
      <h2 className="text-lg font-bold text-slate-700 mb-4">
        Tenants ({active.length} active{pending.length > 0 && `, ${pending.length} pending`})
      </h2>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : tenancies.length === 0 ? (
        <p className="text-slate-500 text-sm">
          No tenants yet — share your invite code above to get started.
        </p>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-2">
                Pending — needs a room
              </h3>
              <ul className="space-y-3">
                {pending.map((t) => (
                  <li
                    key={t.id}
                    className="border border-amber-300 bg-amber-50 rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">{t.profiles?.full_name}</p>
                      <p className="text-xs text-slate-400">
                        Joined {new Date(t.created_at).toLocaleDateString()}
                      </p>
                      {t.room_id && (
                        <p className="text-xs font-medium text-amber-600">
                          Requested {t.rooms?.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRoom[t.id] ?? t.room_id ?? ''}
                        onChange={(e) =>
                          setSelectedRoom((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                        className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      >
                        <option value="">Pick a room…</option>
                        {rooms.map((room) => {
                          const used = occupancy[room.id] ?? 0
                          const full = used >= room.capacity
                          return (
                            <option key={room.id} value={room.id} disabled={full}>
                              {room.name} — {used}/{room.capacity} beds{full ? ' (full)' : ''}
                            </option>
                          )
                        })}
                      </select>
                      <button
                        onClick={() => assignRoom(t)}
                        disabled={busyId === t.id}
                        className="bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => endTenancy(t, 'Decline')}
                        disabled={busyId === t.id}
                        className="text-sm font-medium text-slate-400 hover:text-red-500 px-2"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {active.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Active
              </h3>
              <ul className="space-y-2">
                {active.map((t) => (
                  <li
                    key={t.id}
                    className="border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">{t.profiles?.full_name}</p>
                      <p className="text-xs text-slate-400">
                        {t.rooms?.name} · since {t.start_date}
                        {t.profiles?.phone ? ` · ${t.profiles.phone}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => endTenancy(t, 'End tenancy for')}
                      disabled={busyId === t.id}
                      className="text-sm font-medium text-slate-400 hover:text-red-500"
                    >
                      End tenancy
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}