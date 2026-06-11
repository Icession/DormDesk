import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import CreatePropertyForm from '../components/CreatePropertyForm'
import InviteCodeCard from '../components/InviteCodeCard'
import RoomsSection from '../components/RoomsSection'
import TenantsSection from '../components/TenantsSection'

export default function OwnerDashboard() {
  const { session, signOut } = useAuth()
  const [property, setProperty] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: props, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)

      if (error) console.error('Property load failed:', error.message)
      const prop = props?.[0] ?? null
      setProperty(prop)

      if (prop) {
        const { data: roomRows, error: roomErr } = await supabase
          .from('rooms')
          .select('*')
          .eq('property_id', prop.id)
          .order('created_at', { ascending: true })

        if (roomErr) console.error('Rooms load failed:', roomErr.message)
        setRooms(roomRows ?? [])
      }
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-700">
          DormDesk · {property ? property.name : 'Owner'}
        </h1>
        <button onClick={signOut} className="text-sm font-medium text-slate-500 hover:text-slate-700">
          Log out
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : !property ? (
          <CreatePropertyForm ownerId={session.user.id} onCreated={setProperty} />
        ) : (
          <div className="space-y-6">
            <InviteCodeCard code={property.invite_code} />
            <TenantsSection propertyId={property.id} rooms={rooms} />
            <RoomsSection propertyId={property.id} rooms={rooms} setRooms={setRooms} />
          </div>
        )}
      </main>
    </div>
  )
}