import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

export default function StatsRow({ propertyId }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_owner_stats', {
        p_property_id: propertyId,
      })
      if (error) {
        console.error('Stats load failed:', error.message)
        return
      }
      setStats(data?.[0] ?? null)
    }
    load()
  }, [propertyId])

  if (!stats) return null

  const occupancyPct =
    Number(stats.beds_total) > 0
      ? Math.round((Number(stats.beds_occupied) / Number(stats.beds_total)) * 100)
      : 0

  const monthName = new Date().toLocaleDateString('en-PH', { month: 'long' })

  const cards = [
    {
      label: 'Occupancy',
      value: `${stats.beds_occupied}/${stats.beds_total}`,
      sub: `beds · ${occupancyPct}% full`,
    },
    {
      label: `Collected in ${monthName}`,
      value: peso.format(stats.collected_this_month),
      sub: 'approved payments',
    },
    {
      label: 'Unpaid bills',
      value: stats.unpaid_bills,
      sub: 'incl. partial',
      alert: Number(stats.unpaid_bills) > 0,
    },
    {
      label: 'Open maintenance',
      value: stats.open_requests,
      sub: 'pending + in progress',
      alert: Number(stats.open_requests) > 0,
    },
  ]

  return (
    <div>
      {Number(stats.pending_payments) > 0 && (
        <div className="bg-amber-100 border border-amber-300 text-amber-800 text-sm font-medium rounded-xl px-4 py-3 mb-4">
          {stats.pending_payments} payment{Number(stats.pending_payments) > 1 ? 's' : ''} waiting
          for your review — check the Bills section.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow border border-amber-200 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.alert ? 'text-rose-600' : 'text-slate-700'}`}>
              {c.value}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}