import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import StatusBadge from './StatusBadge'
import ImagePickerField from './ImagePickerField'

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

const inputCls =
  'rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500'

export default function TenantBills({ tenancyId }) {
  const { session } = useAuth()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  // record-payment form
  const [openFormId, setOpenFormId] = useState(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('gcash')
  const [refNo, setRefNo] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('bills')
      .select('*, bill_items(*), payments(*)')
      .eq('tenancy_id', tenancyId)
      .order('billing_month', { ascending: false })

    if (error) console.error('Bills load failed:', error.message)
    setBills(data ?? [])
    setLoading(false)
  }, [tenancyId])

  useEffect(() => {
    load()
  }, [load])

  const billTotal = (b) => b.bill_items.reduce((sum, i) => sum + Number(i.amount), 0)
  const approvedPaid = (b) =>
    b.payments.filter((p) => p.status === 'approved').reduce((s, p) => s + Number(p.amount), 0)
  const remaining = (b) => Math.max(billTotal(b) - approvedPaid(b), 0)
  const monthLabel = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })

  function openForm(bill) {
    setOpenFormId(bill.id)
    setAmount(String(remaining(bill) || ''))
    setMethod('gcash')
    setRefNo('')
    setFile(null)
    setError('')
  }

  async function submitPayment(bill) {
    setError('')
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setSubmitting(true)

    // 1. Upload the proof image (optional — e.g. cash has no screenshot)
    let proof_path = null
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('payment-proofs').upload(path, file)
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`)
        setSubmitting(false)
        return
      }
      proof_path = path
    }

    // 2. File the payment claim (starts as 'pending' — RLS enforces that)
    const { error: insErr } = await supabase.from('payments').insert({
      bill_id: bill.id,
      tenant_id: session.user.id,
      amount: Number(amount),
      method,
      reference_number: refNo.trim() || null,
      proof_path,
    })

    if (insErr) {
      setError(insErr.message)
      setSubmitting(false)
      return
    }
    setOpenFormId(null)
    setSubmitting(false)
    load()
  }

  async function viewProof(path) {
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(path, 300)
    if (error) alert(error.message)
    else window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-amber-200 p-6">
      <h2 className="text-lg font-bold text-slate-700 mb-4">My bills</h2>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : bills.length === 0 ? (
        <p className="text-slate-500 text-sm">No bills yet — your owner hasn't billed you.</p>
      ) : (
        <ul className="space-y-3">
          {bills.map((bill) => (
            <li key={bill.id} className="border border-amber-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-slate-700">{monthLabel(bill.billing_month)}</p>
                  <p className="text-xs text-slate-400">Due {bill.due_date}</p>
                </div>
                <StatusBadge status={bill.status} />
              </div>

              <ul className="space-y-1 mb-3">
                {bill.bill_items.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-700">{peso.format(item.amount)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between border-t border-amber-200 pt-2 font-bold text-slate-700">
                <span>Total</span>
                <span>{peso.format(billTotal(bill))}</span>
              </div>
              {approvedPaid(bill) > 0 && bill.status !== 'paid' && (
                <div className="flex justify-between text-sm text-slate-500 mt-1">
                  <span>Remaining</span>
                  <span>{peso.format(remaining(bill))}</span>
                </div>
              )}

              {bill.payments.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    My payments
                  </h4>
                  <ul className="space-y-2">
                    {bill.payments.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                      >
                        <span>
                          <span className="font-medium text-slate-700">{peso.format(p.amount)}</span>
                          <span className="text-slate-400">
                            {' '}· {p.method}
                            {p.reference_number ? ` · Ref ${p.reference_number}` : ''}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          {p.proof_path && (
                            <button
                              onClick={() => viewProof(p.proof_path)}
                              className="text-xs font-medium text-slate-500 hover:text-slate-700 underline"
                            >
                              View proof
                            </button>
                          )}
                          <StatusBadge status={p.status} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {bill.status !== 'paid' && openFormId !== bill.id && (
                <button
                  onClick={() => openForm(bill)}
                  className="mt-4 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Record a payment
                </button>
              )}

              {openFormId === bill.id && (
                <div className="mt-4 border-t border-amber-200 pt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="number" min="1" step="0.01" placeholder="Amount (₱)"
                      value={amount} onChange={(e) => setAmount(e.target.value)}
                      className={`${inputCls} w-32`}
                    />
                    <select
                      value={method} onChange={(e) => setMethod(e.target.value)}
                      className={inputCls}
                    >
                      <option value="gcash">GCash</option>
                      <option value="bank">Bank transfer</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      placeholder="Reference # (optional)"
                      value={refNo} onChange={(e) => setRefNo(e.target.value)}
                      className={`${inputCls} flex-1 min-w-36`}
                    />
                  </div>

                  <ImagePickerField
                    file={file}
                    onChange={setFile}
                    label="Attach proof screenshot"
                    hint="GCash/bank receipt · optional for cash · max 5MB"
                  />

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => submitPayment(bill)}
                      disabled={submitting}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                      {submitting ? 'Submitting…' : 'Submit payment'}
                    </button>
                    <button
                      onClick={() => setOpenFormId(null)}
                      className="text-sm font-medium text-slate-400 hover:text-slate-600 px-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}