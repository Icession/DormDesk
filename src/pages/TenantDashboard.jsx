import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import JoinPropertyForm from '../components/JoinPropertyForm'
import TenantBills from '../components/TenantBills'
import TenantMaintenance from '../components/TenantMaintenance'
import RoomPicker from '../components/RoomPicker'

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

export default function TenantDashboard() {
  const { profile, signOut } = useAuth()
  const [tenancy, setTenancy] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadTenancy = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tenancies')
      .select('*, properties(name, address), rooms(name, monthly_rate)')
      .in('status', ['pending', 'active'])
      .maybeSingle()

    if (error) console.error('Tenancy load failed:', error.message)
    setTenancy(data ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTenancy()
  }, [loadTenancy])

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-700">DormDesk · Tenant</h1>
        <button onClick={signOut} className="text-sm font-medium text-slate-500 hover:text-slate-700">
          Log out
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : !tenancy ? (
          <JoinPropertyForm onJoined={loadTenancy} />
        ) : tenancy.status === 'pending' ? (
          <div className="bg-white rounded-2xl shadow border border-amber-200 p-8 mt-6">
            <div className="text-center mb-6">
              <p className="text-3xl mb-2">⏳</p>
              <h2 className="text-xl font-bold text-slate-700 mb-1">
                You've joined {tenancy.properties?.name}!
              </h2>
              <p className="text-slate-500">
                {tenancy.room_id
                  ? `You requested ${tenancy.rooms?.name} — waiting for the owner to approve.`
                  : 'Pick the room that fits your budget — the owner will confirm it.'}
              </p>
            </div>

            <RoomPicker currentRoomId={tenancy.room_id} onRequested={loadTenancy} />

            <div className="text-center mt-6">
              <button
                onClick={loadTenancy}
                className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
              >
                Refresh status
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            <div className="bg-white rounded-2xl shadow border border-amber-200 p-6">
              <h2 className="text-lg font-bold text-slate-700 mb-4">My home</h2>
              <p className="text-slate-700 font-semibold">{tenancy.properties?.name}</p>
              {tenancy.properties?.address && (
                <p className="text-sm text-slate-500">{tenancy.properties.address}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Room</p>
                  <p className="font-semibold text-slate-700">{tenancy.rooms?.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Monthly rent</p>
                  <p className="font-semibold text-slate-700">
                    {peso.format(tenancy.rooms?.monthly_rate ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Since</p>
                  <p className="font-semibold text-slate-700">{tenancy.start_date}</p>
                </div>
              </div>
            </div>

            <TenantBills tenancyId={tenancy.id} />
            <TenantMaintenance tenancyId={tenancy.id} />
          </div>
        )}
      </main>
    </div>
  )
}