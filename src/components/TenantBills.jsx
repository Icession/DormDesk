
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import StatusBadge from './StatusBadge'

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

export default function TenantBills({ tenancyId }) {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('bills')
        .select('*, bill_items(*)')
        .eq('tenancy_id', tenancyId)
        .order('billing_month', { ascending: false })

      if (error) console.error('Bills load failed:', error.message)
      setBills(data ?? [])
      setLoading(false)
    }
    load()
  }, [tenancyId])

  const billTotal = (b) => b.bill_items.reduce((sum, i) => sum + Number(i.amount), 0)
  const monthLabel = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })

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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}