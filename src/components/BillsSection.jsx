import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import StatusBadge from './StatusBadge'

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

const inputCls =
  'rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500'

const BILL_SELECT = '*, bill_items(*), tenancies(id, profiles(full_name), rooms(name))'

export default function BillsSection({ propertyId }) {
  const [tenancies, setTenancies] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  // generate-bill form
  const [tenancyId, setTenancyId] = useState('')
  const [month, setMonth] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // add-item form (used inside the expanded bill)
  const [itemLabel, setItemLabel] = useState('')
  const [itemAmount, setItemAmount] = useState('')

  useEffect(() => {
    async function load() {
      const [tenancyRes, billRes] = await Promise.all([
        supabase
          .from('tenancies')
          .select('id, profiles(full_name), rooms(name, monthly_rate)')
          .eq('property_id', propertyId)
          .eq('status', 'active'),
        supabase
          .from('bills')
          .select(BILL_SELECT)
          .eq('property_id', propertyId)
          .order('billing_month', { ascending: false }),
      ])

      if (tenancyRes.error) console.error('Tenancies load failed:', tenancyRes.error.message)
      if (billRes.error) console.error('Bills load failed:', billRes.error.message)
      setTenancies(tenancyRes.data ?? [])
      setBills(billRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [propertyId])

  function onMonthChange(value) {
    setMonth(value)
    if (value) setDueDate(`${value}-05`) // suggest the 5th; owner can change it
  }

  async function generateBill(e) {
    e.preventDefault()
    setError('')
    const tenancy = tenancies.find((t) => t.id === tenancyId)
    if (!tenancy) {
      setError('Pick a tenant first.')
      return
    }
    setSubmitting(true)

    // 1. Create the bill
    const { data: bill, error: billErr } = await supabase
      .from('bills')
      .insert({
        property_id: propertyId,
        tenancy_id: tenancyId,
        billing_month: `${month}-01`,
        due_date: dueDate,
      })
      .select()
      .single()

    if (billErr) {
      setError(
        billErr.code === '23505'
          ? 'That tenant already has a bill for that month.'
          : billErr.message
      )
      setSubmitting(false)
      return
    }

    // 2. Auto-add the rent line item from the room's rate
    const { error: itemErr } = await supabase.from('bill_items').insert({
      bill_id: bill.id,
      label: `Rent — ${tenancy.rooms?.name ?? 'room'}`,
      amount: tenancy.rooms?.monthly_rate ?? 0,
    })
    if (itemErr) console.error('Rent item failed:', itemErr.message)

    // 3. Refetch the full bill (with items + names) and show it expanded
    const { data: fullBill } = await supabase
      .from('bills')
      .select(BILL_SELECT)
      .eq('id', bill.id)
      .single()

    if (fullBill) {
      setBills((prev) => [fullBill, ...prev])
      setExpandedId(fullBill.id)
    }
    setTenancyId('')
    setMonth('')
    setDueDate('')
    setSubmitting(false)
  }

  async function addItem(billId) {
    if (!itemLabel.trim() || !itemAmount) return
    const { data, error } = await supabase
      .from('bill_items')
      .insert({ bill_id: billId, label: itemLabel.trim(), amount: Number(itemAmount) })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, bill_items: [...b.bill_items, data] } : b))
    )
    setItemLabel('')
    setItemAmount('')
  }

  async function deleteItem(billId, itemId) {
    const { error } = await supabase.from('bill_items').delete().eq('id', itemId)
    if (error) {
      alert(error.message)
      return
    }
    setBills((prev) =>
      prev.map((b) =>
        b.id === billId ? { ...b, bill_items: b.bill_items.filter((i) => i.id !== itemId) } : b
      )
    )
  }

  async function deleteBill(bill) {
    if (!window.confirm('Delete this bill and all its items?')) return
    const { error } = await supabase.from('bills').delete().eq('id', bill.id)
    if (error) {
      alert(error.message)
      return
    }
    setBills((prev) => prev.filter((b) => b.id !== bill.id))
  }

  const billTotal = (b) => b.bill_items.reduce((sum, i) => sum + Number(i.amount), 0)
  const monthLabel = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl shadow border border-amber-200 p-6">
      <h2 className="text-lg font-bold text-slate-700 mb-4">Bills</h2>

      {/* Generate bill */}
      <form
        onSubmit={generateBill}
        className="grid grid-cols-1 sm:grid-cols-[1fr_150px_150px_auto] gap-3 mb-2"
      >
        <select
          required value={tenancyId}
          onChange={(e) => setTenancyId(e.target.value)}
          className={inputCls}
        >
          <option value="">Bill which tenant…</option>
          {tenancies.map((t) => (
            <option key={t.id} value={t.id}>
              {t.profiles?.full_name} ({t.rooms?.name})
            </option>
          ))}
        </select>
        <input
          type="month" required value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          className={inputCls}
        />
        <input
          type="date" required value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputCls}
        />
        <button
          type="submit" disabled={submitting}
          className="bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          Generate bill
        </button>
      </form>
      <p className="text-xs text-slate-400 mb-3">
        Rent is added automatically from the room rate — open the bill to add water/electric shares.
      </p>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Bills list */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : bills.length === 0 ? (
        <p className="text-slate-500 text-sm">No bills yet — generate the first one above.</p>
      ) : (
        <ul className="space-y-3 mt-2">
          {bills.map((bill) => (
            <li key={bill.id} className="border border-amber-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}
                className="w-full flex flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-amber-50"
              >
                <div>
                  <p className="font-semibold text-slate-700">
                    {bill.tenancies?.profiles?.full_name} · {monthLabel(bill.billing_month)}
                  </p>
                  <p className="text-xs text-slate-400">Due {bill.due_date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">{peso.format(billTotal(bill))}</span>
                  <StatusBadge status={bill.status} />
                  <span className="text-slate-400">{expandedId === bill.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedId === bill.id && (
                <div className="border-t border-amber-200 p-4 bg-amber-50/50">
                  <ul className="space-y-2 mb-4">
                    {bill.bill_items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="flex items-center gap-3">
                          <span className="font-medium text-slate-700">
                            {peso.format(item.amount)}
                          </span>
                          <button
                            onClick={() => deleteItem(bill.id, item.id)}
                            title="Remove item"
                            className="text-slate-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      placeholder="Item (e.g. Water share)"
                      value={itemLabel} onChange={(e) => setItemLabel(e.target.value)}
                      className={`${inputCls} flex-1 min-w-40 text-sm py-2`}
                    />
                    <input
                      type="number" min="0" step="0.01" placeholder="₱"
                      value={itemAmount} onChange={(e) => setItemAmount(e.target.value)}
                      className={`${inputCls} w-28 text-sm py-2`}
                    />
                    <button
                      onClick={() => addItem(bill.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                      Add item
                    </button>
                    <button
                      onClick={() => deleteBill(bill)}
                      className="ml-auto text-sm font-medium text-slate-400 hover:text-red-500"
                    >
                      Delete bill
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