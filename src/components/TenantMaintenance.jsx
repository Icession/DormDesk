import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import StatusBadge from './StatusBadge'
import ImagePickerField from './ImagePickerField'

const inputCls =
  'w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500'

export default function TenantMaintenance({ tenancyId }) {
  const { session } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('tenancy_id', tenancyId)
      .order('created_at', { ascending: false })

    if (error) console.error('Requests load failed:', error.message)
    setRequests(data ?? [])
    setLoading(false)
  }, [tenancyId])

  useEffect(() => {
    load()
  }, [load])

  async function submitRequest() {
    setError('')
    if (!title.trim()) {
      setError('Give the issue a short title.')
      return
    }
    setSubmitting(true)

    let photo_path = null
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('maintenance-photos')
        .upload(path, file)
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`)
        setSubmitting(false)
        return
      }
      photo_path = path
    }

    const { error: insErr } = await supabase.from('maintenance_requests').insert({
      tenancy_id: tenancyId,
      title: title.trim(),
      description: description.trim() || null,
      photo_path,
    })

    if (insErr) {
      setError(insErr.message)
      setSubmitting(false)
      return
    }
    setFormOpen(false)
    setTitle('')
    setDescription('')
    setFile(null)
    setSubmitting(false)
    load()
  }

  async function viewPhoto(path) {
    const { data, error } = await supabase.storage
      .from('maintenance-photos')
      .createSignedUrl(path, 300)
    if (error) alert(error.message)
    else window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-amber-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-700">Maintenance</h2>
        {!formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Report an issue
          </button>
        )}
      </div>

      {formOpen && (
        <div className="border border-amber-200 rounded-xl p-4 mb-4 space-y-3">
          <input
            placeholder="What's the problem? (e.g. Leaking faucet)"
            value={title} onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
          <textarea
            placeholder="More details (optional)" rows={3}
            value={description} onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
          />
          <ImagePickerField
            file={file}
            onChange={setFile}
            label="Attach a photo of the issue"
            hint="Optional · max 5MB"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={submitRequest}
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              onClick={() => setFormOpen(false)}
              className="text-sm font-medium text-slate-400 hover:text-slate-600 px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-slate-500 text-sm">No issues reported — nice and quiet.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((r) => (
            <li key={r.id} className="border border-amber-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-700">{r.title}</p>
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
                </div>
              </div>
              {r.description && <p className="text-sm text-slate-500 mt-1">{r.description}</p>}
              <p className="text-xs text-slate-400 mt-1">
                Filed {new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}