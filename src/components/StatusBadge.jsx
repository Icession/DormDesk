const styles = {
  unpaid: 'bg-rose-100 text-rose-700',
  partially_paid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-rose-100 text-rose-700',
}

const labels = {
  unpaid: 'Unpaid',
  partially_paid: 'Partial',
  paid: 'Paid',
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        styles[status] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}