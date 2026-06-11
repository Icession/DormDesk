import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import StatusBadge from './StatusBadge'

const REQ_SELECT = '*, tenancies!inner(property_id, profiles(full_name), rooms(name))'

export default function MaintenanceSection({ propertyId }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(REQ_SELECT)
        .eq('tenancies.property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) console.error('Maintenance load failed:', error.message)
      setRequests(data ?? [])
      setLoading(false)
    }
    load()
  }, [propertyId])

  async function setStatus(req, status) {
    setBusyId(req.id)
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ status })
      .eq('id', req.id)
      .select(REQ_SELECT)
      .single()

    if (error) alert(error.message)
    else setRequests((prev) => prev.map((r) => (r.id === req.id ? data : r)))
    setBusyId(null)
  }

  async function viewPhoto(path) {
    const { data, error } = await supabase.storage
      .from('maintenance-photos')
      .createSignedUrl(path, 300)
    if (error) alert(error.message)
    else window.open(data.signedUrl, '_blank')
  }

  const open = requests.filter((r) => r.status !== 'resolved')
  const resolved = requests.filter((r) => r.status === 'resolved')

  function RequestRow({ r }) {
    return (
      <li className="border border-amber-200 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-700">{r.title}</p>
            <p className="text-xs text-slate-400">
              {r.tenancies?.profiles?.full_name} · {r.tenancies?.rooms?.name ?? 'no room'} ·{' '}
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {r.photo_path && (
              <button
                onClick={() => viewPhoto(r.photo_path)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 underline"
              >
                View photo
              </button>
            )}
            <StatusBadge status={r.status} />
            {r.status === 'pending' && (
              <button
                onClick={() => setStatus(r, 'in_progress')}
                disabled={busyId === r.id}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                Start
              </button>
            )}
            {r.status === 'in_progress' && (
              <button
                onClick={() => setStatus(r, 'resolved')}
                disabled={busyId === r.id}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                Mark resolved
              </button>
            )}
          </div>
        </div>
        {r.description && <p className="text-sm text-slate-500 mt-2">{r.description}</p>}
      </li>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-amber-200 p-6">
      <h2 className="text-lg font-bold text-slate-700 mb-4">
        Maintenance{open.length > 0 ? ` (${open.length} open)` : ''}
      </h2>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-slate-500 text-sm">No maintenance requests yet.</p>
      ) : (
        <div className="space-y-5">
          {open.length > 0 && (
            <ul className="space-y-2">
              {open.map((r) => (
                <RequestRow key={r.id} r={r} />
              ))}
            </ul>
          )}
          {resolved.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Resolved
              </h3>
              <ul className="space-y-2">
                {resolved.map((r) => (
                  <RequestRow key={r.id} r={r} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}